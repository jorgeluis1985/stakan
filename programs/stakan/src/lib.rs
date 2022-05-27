use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, transfer, TokenAccount};

//use agsol_borsh_schema::BorshSchema;

mod game_global_account;

#[error_code]
pub enum GameError {
    #[msg("Initialize global wallet with more funds.")]
    GlobalFundsTooLow,

    #[msg("Invalid Game Global Account public key.")]
    InvalidGlobalStateKey,

    #[msg("Could not transfer stake to Global Account.")]
    CouldNotTransferStake,

    #[msg("Could not transfer reward from Global Account.")]
    CouldNotTransferReward,

    #[msg("Stake is higher than fund can accept.")]
    StakeTooHigh,

    #[msg("Invalid value of game session duration.")]
    InvalidDuration,

//    #[msg("Username too long. Max allowed length: {}", SignUpUser::USERNAME_LEN)]
    #[msg("Username too long")]
    UsernameTooLong,

}


#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub enum GameSessionStage {
    Ongoing,
    Over
}

#[derive(Accounts)]
pub struct InitGlobalState<'info> {
    #[account(init, payer = global_wallet, space = 8 + 100)]
    pub game_global_account: Account<'info, GameGlobalState>,
    #[account(mut)]
    pub global_wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignUpUser<'info> {
    #[account(init, payer = user_wallet, space = 8 + 1000,
        seeds = [b"user_account".as_ref()],
        bump,
    )]
    user_account: Account<'info, User>,
    
    #[account(mut)]
    user_wallet: Signer<'info>,

    mint: Account<'info, Mint>,  

    #[account(
        init, 
        payer = user_wallet,
        seeds = [b"user_mint_account"],
        bump,
        token::mint = mint,
        token::authority = user_account,
    )]
    mint_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}
impl SignUpUser<'_> {
    const USERNAME_LEN: usize = 120;
}

#[derive(Accounts)]
#[instruction(pda_game_session_account_bump: u8)]
pub struct InitGameSession<'info> {

    #[account(init, payer = user_wallet, 
        space = InitGameSession::SIZE,
        seeds = [b"game_session", user_wallet.key().as_ref()],
        bump,
    )]
    game_session_account: Account<'info, GameSession>,

    #[account(mut)]
    user: Signer<'info>,
    
    #[account(
        mut,
        constraint=user_wallet.owner == user.key(),
        constraint=user_wallet.mint == stake_mint.key()
    )]
    user_wallet: Account<'info, TokenAccount>,

    #[account(
        init, 
        payer = user_wallet,
        seeds = [b"stake_wallet", user_wallet.key().as_ref()],
        bump,
        token::mint = stake_mint,
        token::authority = game_session_account,
    )]
    stake_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    game_global_account: Account<'info, GameGlobalState>,

    stake_mint: Account<'info, Mint>,  

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}


impl InitGameSession<'_> {
    const SIZE: usize = 8 + 1000;
}

#[account]
pub struct GameSession {
    user_wallet: Pubkey,
    stake_wallet: Pubkey,
    arweave_storage_address: String,
    score: u64,
    duration_millis: u64,
    stake: u64,
    stake_mint: Pubkey,
    stage: GameSessionStage,
} 

#[account]
//#[derive(agsol_borsh_schema::BorshSchema)]
pub struct User {
    inner_size: u16,
    user: UserInner,    
} 
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UserInner {
    username: Vec<u8>,
    
    max_score: u64,
    saved_game_sessions: u64,
    mint: Pubkey,
    mint_account: Pubkey,
} 

impl UserInner {
    pub(crate) fn size_for_borsh(&self) -> u16 {
        use std::mem::size_of;

        (
            // borsh serializes strings as: repr(s.len() as u32) repr(s as Vec<u8>) 
            size_of::<u32>() + self.username.len() 
            + size_of::<u64>()
            + size_of::<u64>()
            + size_of::<Pubkey>()
            + size_of::<Pubkey>()
        ) as u16
    }
}

#[account]
pub struct GameGlobalState {
    pub global_max_score: u64,
    pub funds: u64,
} 

impl GameGlobalState {
    const MIN_STAKE_LAMPORTS: u64 = 1000000;
}

declare_id!("StakanXf8bymj5JEgJYH4qUQ7xTtoR1W2BeHUbDjCJb");

#[program]
pub mod stakan {
    use super::*;

    pub fn sign_up_user(ctx: Context<SignUpUser>,
        username: String,
        ) -> Result<()> {
            if SignUpUser::USERNAME_LEN < username.len() {
                return Err(GameError::UsernameTooLong.into())
            }
            
            let user_game_account = &mut ctx.accounts.user_account;
            
            user_game_account.user = UserInner {
                username: username.into_bytes(),          
                max_score: 0,
                saved_game_sessions: 0,
                mint: ctx.accounts.mint.key(),
                mint_account: ctx.accounts.mint_account.key(),
            };

            user_game_account.inner_size = (
                user_game_account.user.size_for_borsh() 
            ) as u16;
            
            Ok(())
    }

    pub fn init_game_session(ctx: Context<InitGameSession>,
        arweave_storage_address: String, 
//        bump: u8,
        stake: u64) -> Result<()> {
        // reward is funds/2, so stake should be smaller than funds 
        // in order the reward is greater than stake in case the user is rewarded 
        if ctx.accounts.game_global_account.funds <= stake {
            return Err(GameError::StakeTooHigh.into())
        }
        ctx.accounts.game_session_account.user_wallet = ctx.accounts.user_wallet.key();
        ctx.accounts.game_session_account.stake_wallet = ctx.accounts.stake_wallet.key();
        ctx.accounts.game_session_account.stake_mint = ctx.accounts.stake_mint.key();

        ctx.accounts.game_session_account.stake = stake;
        ctx.accounts.game_session_account.arweave_storage_address = arweave_storage_address;
        ctx.accounts.game_session_account.duration_millis = 0;
        ctx.accounts.game_session_account.score = 0;
        ctx.accounts.game_session_account.stage = GameSessionStage::Ongoing;

        if stake > 0 {
            match
                anchor_spl::token::transfer(
                    CpiContext::new(
 //                       ctx.accounts.system_program.to_account_info(),
                        ctx.accounts.token_program.to_account_info(),
                        anchor_spl::token::Transfer {
                            from: ctx
                                .accounts
                                .user_wallet
                                .to_account_info(),
                            to: ctx
                                .accounts
                                .stake_wallet
                                .to_account_info(),
                            authority: ctx.accounts.user.to_account_info(),
                        },
                    ),
                    stake,
                ) 
                {
                    Ok(()) => {
                    //                    ctx.accounts.game_global_account.funds += stake;
                        Ok(())
                    },
                    Err(_) => Err(GameError::CouldNotTransferStake.into()),
                }        
        } else {
            Ok(())
        }
    }


    /*
#[derive(Accounts)]
pub struct SaveGameSession<'info> {
    #[account(mut, close = user_wallet, has_one = user_wallet)]
    pub game_session_account: Account<'info, GameSession>,


    #[account(mut)]
    pub game_global_account: Account<'info, GameGlobalState>,
    
    #[account(mut)]
    pub user_game_account: Account<'info, UserGame>,
    
    #[account(mut)]
//    pub user_wallet: Signer<'info>,
    /// CHECK:` doc comment explaining why no checks through types are necessary.
    pub user_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub game_session_signer: Signer<'info>,
    #[account(mut)]
    pub global_wallet: Signer<'info>,
//    #[account(mut)]
//    pub session_account: Signer<'info>,
    pub system_program: Program<'info, System>,
}
*/

}




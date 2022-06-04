use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount};
use anchor_spl::associated_token::{AssociatedToken, };

#[account]
pub(crate) struct StakanGlobalState {
    pub global_max_score: u64,
//    funds: u64,
    pub mint_token: Pubkey,
//    token_faucet: Pubkey,
    pub reward_funds_account: Pubkey,
} 

impl StakanGlobalState {
    pub(crate) fn size_for_borsh() -> usize {
        use std::mem::size_of;
            8
            + size_of::<u64>()
            + size_of::<Pubkey>()
            + size_of::<Pubkey>()
    }    
}

#[derive(Accounts)]
pub struct SetupStakan<'info> {
    #[account(init, payer = program_wallet, 
        space = StakanGlobalState::size_for_borsh(),
        seeds = [
            b"stakan_state_account".as_ref(), 
        ],
        bump,
    )]
    stakan_state_account: Account<'info, StakanGlobalState>,

    #[account(
        init,
        payer = program_wallet,
        seeds = [b"stakan_mint".as_ref()],
        bump,
        mint::decimals = 0,
        mint::authority = stakan_state_account
    )]
    mint: Account<'info, Mint>,

    #[account(init, payer = program_wallet,
        associated_token::mint = mint,
        associated_token::authority = stakan_state_account,
    )]  
    reward_funds_account: Account<'info, TokenAccount>,

    #[account(mut)]
    program_wallet: Signer<'info>,
    
    associated_token_program: Program<'info, AssociatedToken>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

impl SetupStakan<'_> {
    const INITIAL_REWARD_FUNDS: u64 = 100;
}

pub fn set_up_stakan(ctx: Context<SetupStakan>,
    stakan_state_account_bump: u8,
) -> Result<()> {

    let temp_bump: [u8; 1] = stakan_state_account_bump.to_le_bytes();
    let signer_seeds = [
        b"stakan_state_account".as_ref(),
        &temp_bump
    ];
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),

            anchor_spl::token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.reward_funds_account.to_account_info(),
                authority: ctx.accounts.stakan_state_account.to_account_info(),
            },
            &[&signer_seeds]
        ), 
        SetupStakan::INITIAL_REWARD_FUNDS
    )?;

    let acc = &mut ctx.accounts.stakan_state_account;
    acc.mint_token = ctx.accounts.mint.key();
//        acc.token_faucet = ctx.accounts.token_faucet.key();
    acc.reward_funds_account = ctx.accounts.reward_funds_account.key(); 
    acc.global_max_score = 0;
//        acc.funds = 0;
    Ok(())
    
}

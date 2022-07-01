function pieceI() {
    return [
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
    ]
  }
  
  function pieceS() {
    return [
      [
        [0, 2, 2, 0],
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 2, 0, 0],
        [0, 2, 2, 0],
        [0, 0, 2, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 2, 2, 0],
        [2, 2, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [2, 0, 0, 0],
        [2, 2, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
      ],
    ]
  }
  
  function pieceT() {
    return [
      [
        [0, 3, 0, 0],
        [3, 3, 3, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 3, 0, 0],
        [0, 3, 3, 0],
        [0, 3, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [3, 3, 3, 0],
        [0, 3, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 3, 0, 0],
        [3, 3, 0, 0],
        [0, 3, 0, 0],
        [0, 0, 0, 0],
      ],
    ]
  }
  
  function pieceZ() {
    return [
      [
        [4, 4, 0, 0],
        [0, 4, 4, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 4, 0],
        [0, 4, 4, 0],
        [0, 4, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [4, 4, 0, 0],
        [0, 4, 4, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 4, 0, 0],
        [4, 4, 0, 0],
        [4, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ]
  }
  
  function pieceL() {
    return [
      [
        [0, 0, 0, 0],
        [5, 5, 5, 0],
        [5, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [5, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 5, 0],
        [5, 5, 5, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 5, 0],
        [0, 0, 0, 0],
      ],
    ]
  }

  function pieceJ() {
    return [
      [
        [0, 0, 0, 0],
        [6, 6, 6, 0],
        [0, 0, 6, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 6, 0, 0],
        [0, 6, 0, 0],
        [6, 6, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [6, 0, 0, 0],
        [6, 6, 6, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 6, 6, 0],
        [0, 6, 0, 0],
        [0, 6, 0, 0],
        [0, 0, 0, 0],
      ],
    ]
  }

  function pieceO() {
    return [
      [
        [0, 0, 0, 0],
        [0, 7, 7, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 7, 7, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 7, 7, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 7, 7, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
      ],
    ]
  }

  const tetriminoMap = {
    1: 'I',
    2: 'S',
    3: 'T',
    4: 'Z',
    5: 'L',
    6: 'J',
    7: 'O',
  }
  
  export function createTetrimino(kind) {
      switch (kind) {
        case 'I': return { piece: pieceI(), color: 'rgb(5, 75, 75)' };
        case 'J': return { piece: pieceJ(), color: 'rgb(35, 15, 175)' };
        case 'L': return { piece: pieceL(), color: 'rgb(210, 130, 25)' };
        case 'O': return { piece: pieceO(), color: 'rgb(250, 230, 20)' };
        case 'S': return { piece: pieceS(), color: 'rgb(75, 210, 25)' };
        case 'T': return { piece: pieceT(), color: 'rgb(80, 5, 120)' };
        case 'Z': return { piece: pieceZ(), color: 'rgb(120, 5, 25)' };
      }
  }

  export function createTetriminoByValue(value) {
//    if (value > 6) throw("value: ", value);
    return createTetrimino(tetriminoMap[value]);
  }

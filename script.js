document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator').querySelector('span');
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('reset-btn');
    
    let selectedPiece = null;
    let currentPlayer = 'white';
    let gameState = 'playing'; // 'playing', 'checkmate', 'stalemate'
    
    // Estado inicial do tabuleiro
    let chessBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    
    // Mapeamento de peças para símbolos Unicode
    const pieceSymbols = {
        'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
        'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
    };
    
    // Inicializa o tabuleiro
    function initializeBoard() {
        board.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = chessBoard[row][col];
                if (piece) {
                    square.textContent = pieceSymbols[piece];
                    square.dataset.piece = piece;
                    square.classList.add(piece === piece.toLowerCase() ? 'black' : 'white');
                }
                
                square.addEventListener('click', () => handleSquareClick(row, col));
                board.appendChild(square);
            }
        }
        
        updateGameInfo();
    }
    
    // Manipula cliques nas casas
    function handleSquareClick(row, col) {
        if (gameState !== 'playing') return;
        
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        const piece = chessBoard[row][col];
        
        // Se já tiver uma peça selecionada, tenta mover
        if (selectedPiece) {
            const [fromRow, fromCol] = selectedPiece;
            
            // Verifica se é um movimento válido (simplificado)
            if (isValidMove(fromRow, fromCol, row, col)) {
                movePiece(fromRow, fromCol, row, col);
                selectedPiece = null;
                removeHighlightsAndSelection();
                switchPlayer();
            } 
            // Se clicar na mesma peça, desseleciona
            else if (fromRow === row && fromCol === col) {
                selectedPiece = null;
                removeHighlightsAndSelection();
            }
            // Se clicar em outra peça da mesma cor, seleciona a nova
            else if (piece && isSameColor(piece, chessBoard[fromRow][fromCol])) {
                selectedPiece = [row, col];
                removeHighlightsAndSelection();
                highlightSquare(row, col);
                showPossibleMoves(row, col);
            }
        } 
        // Seleciona uma peça se for da vez do jogador atual
        else if (piece && ((currentPlayer === 'white' && piece === piece.toUpperCase()) || 
                          (currentPlayer === 'black' && piece === piece.toLowerCase()))) {
            selectedPiece = [row, col];
            highlightSquare(row, col);
            showPossibleMoves(row, col);
        }
    }
    
    // Verifica se duas peças são da mesma cor
    function isSameColor(piece1, piece2) {
        if (!piece1 || !piece2) return false;
        return (piece1 === piece1.toUpperCase() && piece2 === piece2.toUpperCase()) ||
               (piece1 === piece1.toLowerCase() && piece2 === piece2.toLowerCase());
    }
    
    // Move uma peça no tabuleiro
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = chessBoard[fromRow][fromCol];
        chessBoard[toRow][toCol] = piece;
        chessBoard[fromRow][fromCol] = '';
        
        // Atualiza a interface
        initializeBoard();
        
        // Verifica estado do jogo
        checkGameState();
    }
    
    // Verifica se o movimento é válido (simplificado)
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = chessBoard[fromRow][fromCol];
        if (!piece) return false;
        
        // Verifica se está tentando capturar peça da mesma cor
        const targetPiece = chessBoard[toRow][toCol];
        if (targetPiece && isSameColor(piece, targetPiece)) {
            return false;
        }
        
        // Regras básicas de movimento (simplificado)
        const dx = Math.abs(toCol - fromCol);
        const dy = Math.abs(toRow - fromRow);
        
        switch (piece.toLowerCase()) {
            case 'p': // Peão
                const direction = piece === 'p' ? 1 : -1;
                // Movimento para frente
                if (fromCol === toCol && !targetPiece) {
                    // Um quadrado
                    if (toRow === fromRow + direction) return true;
                    // Dois quadrados do início
                    if ((piece === 'p' && fromRow === 1) || (piece === 'P' && fromRow === 6)) {
                        if (toRow === fromRow + 2 * direction && !chessBoard[fromRow + direction][fromCol]) {
                            return true;
                        }
                    }
                }
                // Captura
                if (dx === 1 && dy === 1 && targetPiece && !isSameColor(piece, targetPiece)) {
                    return true;
                }
                break;
                
            case 'r': // Torre
                return (fromRow === toRow || fromCol === toCol) && isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'n': // Cavalo
                return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
                
            case 'b': // Bispo
                return dx === dy && isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'q': // Rainha
                return (dx === dy || fromRow === toRow || fromCol === toCol) && isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'k': // Rei
                return dx <= 1 && dy <= 1;
        }
        
        return false;
    }
    
    // Verifica se o caminho entre duas casas está livre (para torre, bispo, rainha)
    function isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = fromRow === toRow ? 0 : (fromRow < toRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (fromCol < toCol ? 1 : -1);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (chessBoard[row][col] !== '') return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    }
    
    // Mostra movimentos possíveis para uma peça
    function showPossibleMoves(row, col) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(row, col, r, c)) {
                    const square = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
                    square.classList.add('highlight');
                }
            }
        }
    }
    
    // Destaca uma casa
    function highlightSquare(row, col) {
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('selected');
    }
    
    // Remove destaques e seleção
    function removeHighlightsAndSelection() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('highlight');
            square.classList.remove('selected');
        });
    }
    
    // Alterna o jogador atual
    function switchPlayer() {
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        updateGameInfo();
    }
    
    // Atualiza informações do jogo
    function updateGameInfo() {
        turnIndicator.textContent = currentPlayer === 'white' ? 'Brancas' : 'Pretas';
        turnIndicator.style.color = currentPlayer === 'white' ? '#333' : '#000';
    }
    
    // Verifica o estado do jogo (simplificado)
    function checkGameState() {
        // Implementação real precisaria verificar xeque, xeque-mate, afogamento, etc.
        // Esta é uma versão simplificada
        let whiteKing = false;
        let blackKing = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = chessBoard[row][col];
                if (piece === 'K') whiteKing = true;
                if (piece === 'k') blackKing = true;
            }
        }
        
        if (!whiteKing) {
            gameState = 'checkmate';
            statusDisplay.textContent = 'Xeque-mate! Pretas vencem!';
        } else if (!blackKing) {
            gameState = 'checkmate';
            statusDisplay.textContent = 'Xeque-mate! Brancas vencem!';
        }
    }
    
    // Reinicia o jogo
    function resetGame() {
        chessBoard = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        
        selectedPiece = null;
        currentPlayer = 'white';
        gameState = 'playing';
        statusDisplay.textContent = 'Jogo em andamento';
        initializeBoard();
    }
    
    // Event listeners
    resetButton.addEventListener('click', resetGame);
    
    // Inicializa o jogo
    initializeBoard();
});
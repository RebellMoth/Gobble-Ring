console.log("avaScript connection works successfully");
// Initialize the 3x3 game board grid memory
let board = [
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
    { player: null, size: null },
];
// Global state variables for managing game data and turns
let moveHistory = [];
let currentPlayer = 'player';
let isGameOver = false;
let selectedPiece = null;

// Fetch human player's inventory buttons from the DOM
const playerBtn = document.querySelectorAll('#player-inventory button');

console.log("Inventory buttons found: ", playerBtn.length, "pcs")

// Add click event listeners to the player's inventory buttons
playerBtn.forEach(button => {
    button.addEventListener('click', (event) => {
        // If game is over or isn't players turn, don't do nothing
       // if (isGameOver || currentPlayer !== 'player') return;

       // Remove selection highlight from all inventory buttons

       playerBtn.forEach(btn => btn.classList.remove('selected'));

        const size = parseInt(event.currentTarget.getAttribute('data-size'));

        // Store the currently selected piece data in memory
        selectedPiece = {
            element: event.currentTarget,
            size: size
        };

        // Apply visual highlight class to the chosen piece
        event.currentTarget.classList.add('selected');
        console.log("Selected piece size is: ", size);
    });
});
// Fetch all board grid cells from the DOM
const boardCells = document.querySelectorAll('#board .cell');

// Add click event listeners to all game board grid cells
boardCells.forEach(cell => {
    cell.addEventListener('click', (event) => {
        // Prevent moves if the game is over or if it is not the human player's turn
        if (isGameOver || currentPlayer !== 'player') {
            return;
        }
        // Force the player to select a piece from inventory first
        if (!selectedPiece) {
            console.log("Please select a piece first");
            return;
        }
        // Handle the return of the oldest piece if inventory is running empty
        handleOldestPieceReturn('player');

        //
        const index = parseInt(event.currentTarget.getAttribute('data-index'));

        console.log('Selected grid cell index: ', index);
        console.log('Attempting to place piece size: ', selectedPiece.size);

        // Check if the placement strictly follows the game rules
        if (isValidMove(index, selectedPiece.size, currentPlayer)) {
            console.log("Move is valid! Placing the piece.");

            let opponent = '';
            if (currentPlayer === 'player') {
                opponent = 'computer';
            } else {
                opponent = 'player';
            }

            const slectedCell = board[index];

            // Capture logic: If the cell contains an opponent's smaller piece, remove it
            if (slectedCell.player === opponent) {
                const eatedSize = slectedCell.size;

                let storageId = '';
                if (opponent === 'player') {
                    storageId = 'player-inventory';
                } else {
                    storageId = 'computer-inventory';
                }

                // Restore the eaten piece back to the opponent's inventory
                const opponentBtn = document.querySelectorAll(`#${storageId} button[data-size="${eatedSize}"]`);
                for (let btn of opponentBtn) {
                    if (btn.style.display === 'none') {
                        btn.style.display = 'flex';
                        break;
                    }
                }

                // Delete the captured move from the history timeline
                const historyIndex = moveHistory.findIndex(move => move.cellIndex === index && move.player === opponent);
                if (historyIndex !== -1) {
                    moveHistory.splice(historyIndex, 1);
                }
            }

            // Update internal game memory and history tracking arrays
            board[index] = { player: currentPlayer, size: selectedPiece.size};
            moveHistory.push({ cellIndex: index, player: currentPlayer, size: selectedPiece.size});

            // Render the piece visually by applying HTML attributes to the cell
            event.currentTarget.setAttribute('data-player', currentPlayer);
            event.currentTarget.setAttribute('data-cell-size', selectedPiece.size);

            // Clear the inventory selection highlight classes
            if (selectedPiece && selectedPiece.element) {
                selectedPiece.element.classList.remove('selected');
            }
            // Hide the used piece from inventory and clear the selection state variable
            selectedPiece.element.style.display = 'none';
            selectedPiece = null;

            // Winner evaluation: Check if this move forms a winning line
            const winner = checkWinner();
            if (winner) {
                isGameOver = true;
                document.getElementById('status-display').textContent = "Game Over! You won!";
                document.getElementById('new-game-button').style.display = "block";
                console.log("Game over! Human player won!");
                return;
            }

            // Turn switching logic between the human player and computer AI
            if (currentPlayer === 'player') {
                currentPlayer = 'computer';
                document.getElementById('status-display').textContent = "Computer is thinking...";
                console.log("Computer's turn now")

                // Trigger the computer AI turn after a natural 1-second delay
                setTimeout(computerTurn, 1000);
            } else {
                currentPlayer = 'player';
                document.getElementById('status-display').textContent = "Your turn";
                console.log("Player's turn now")
            }
        } else {
            console.log("Move is illegal");
        }
    });
});
// Validate if a move is legal according to game rules
function isValidMove(targetIndex, pieceSize, activePlayer) {
    const currentCell = board[targetIndex];

    // Rule 1: Empty grid cells are always valid targets
    if (currentCell.player === null) {
        return true;
    }

    // Rule 2: Cannot place a piece on top of your own piece
    if (currentCell.player === activePlayer) {
        console.log("You already have a piece in this cell.");
        return false;
    }

    // Rule 3: Can only capture an opponent's piece if your piece size is strictly larger
    if (pieceSize > currentCell.size) {
        return true;
    } else {
        console.log("Piece is too small to capture the existing piece in this cell.");
        return false;
    }
}

// Execute the computer AI turn and decision making logic
function computerTurn() {
    if (isGameOver) return;

    // Handle oldest computer piece return if its inventory is running empty
    handleOldestPieceReturn('computer');

    console.log("Computer AI is calculating moves...");

    /// Fetch computer's inventory buttons from the DOM
    const computerBtn = document.querySelectorAll('#computer-inventory button');

    // STAGE 1: ATTACK (Win immediately if a winning move exists)
    for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        for (let btn of computerBtn) {

            // Skip inventory buttons that have already been used and hidden
            if (btn.style.display === 'none') continue;

            const size = parseInt(btn.getAttribute('data-size'));

            // Verify if the calculated move is completely legal
            if (isValidMove(cellIndex, size, 'computer')) {

                // Simulation: Backup the target cell state before making a test move
                const backup = board[cellIndex];

                // Simulation: Apply the temporary test move to game memory
                board[cellIndex] = {player: 'computer', size: size};

                // Simulation: Check if this test move forms a winning combination
                const testWinner = checkWinner();

                // Simulation: Revert the cell state back to original immediately
                board[cellIndex] = backup;

                // Decision: If the simulated move scores a win, execute it permanently
                if (testWinner === 'computer') {
                    console.log(`AI found a winning cell at index: ${cellIndex}!`);

                    selectedPiece = {element: btn, size: size };

                    const targetCell = document.querySelector(`#board .cell[data-index="${cellIndex}"]`);
                    if (targetCell) {
                        // Capture logic: If target cell has human player's piece, return it to inventory
                        if(board[cellIndex].player === 'player') {
                            const eatedSize = board[cellIndex].size;
                            const playerBtn = document.querySelectorAll(`#player-inventory button[data-size="${eatedSize}"]`);
                            for (let pBtn of playerBtn) {
                                if (pBtn && pBtn.style.display === 'none') {
                                    pBtn.style.display = 'flex';
                                    break;
                                }
                            }
                            const historyIndex = moveHistory.findIndex(move => move.cellIndex === cellIndex && move.player === 'player');
                            if (historyIndex !== -1) {
                                moveHistory.splice(historyIndex, 1);
                            }
                        }

                        // Execute the official move to memory and history tracking
                        board[cellIndex] = {player: 'computer', size: size};
                        moveHistory.push({cellIndex: cellIndex, player: 'computer', size: size});

                        // Render the computer's piece visually on the board
                        targetCell.setAttribute('data-player', 'computer');
                        targetCell.setAttribute('data-cell-size', size);
                        if(btn) { 
                            btn.style.display = 'none'; 
                        }
                    }

                    selectedPiece = null;

                    // Final check to see if the game has officially ended in computer victory
                    const winner = checkWinner();
                    if (winner) {
                        isGameOver = true;
                        document.getElementById('status-display').textContent = "Game Over! Computer won!";
                        document.getElementById('new-game-button').style.display = 'block';
                        console.log("Game over. Computer won");
                        return;
                    }

                    // Hand the turn securely back to the human player
                    currentPlayer = 'player';

                    document.getElementById('status-display').textContent = "Your turn";
                    console.log("Human player's turn now");

                    return;
                }
            }
        }
    }
    // STAGE 2: DEFENSE (Block the human player from winning on their next turn)
    for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        for (let btn of computerBtn) {

            if (btn.style.display === 'none') continue;
            const size = parseInt(btn.getAttribute('data-size'));

            if (isValidMove(cellIndex, size, 'computer')) {

                // Simulation: Backup the target cell state before making a test move
                const backup = board[cellIndex];

                // Simulation: Test what would happen if the human player occupied this cell
                board[cellIndex] = {player: 'player', size: size};
                const testWinner = checkWinner();

                // Simulation: Revert the cell state back to original immediately
                board[cellIndex] = backup

                // Decision: If the human player would win here, the computer blocks the cell
                if (testWinner === 'player') {
                    console.log(`AI blocking human player victory at cell index: ${cellIndex}`)

                    selectedPiece = {element: btn, size: size};

                    const targetCell = document.querySelector(`#board .cell[data-index="${cellIndex}"]`);
                    if (targetCell) {
                        // Capture logic: If target cell has human player's piece, return it to inventory
                        if (board[cellIndex].player === 'player') {
                            const eatedSize = board[cellIndex].size;
                            const playerBtn = document.querySelectorAll(`#player-inventory button[data-size="${eatedSize}"]`);
                            for (let pBtn of playerBtn) {
                                if (pBtn && pBtn.style.display === 'none'){
                                    pBtn.style.display = 'flex';
                                    break;
                                }
                            }
                            const historyIndex = moveHistory.findIndex(move => move.cellIndex === cellIndex && move.player === 'player');
                            if (historyIndex !== -1) {
                                moveHistory.splice(historyIndex, 1);
                            }
                        }

                        // Execute the official defensive move to memory and history tracking
                        board[cellIndex] = {player: 'computer', size: size};
                        moveHistory.push({cellIndex: cellIndex, player: 'computer', size: size});

                        // Render the computer's piece visually on the board
                        targetCell.setAttribute('data-player', 'computer');
                        targetCell.setAttribute('data-cell-size', size);
                        if(btn) {
                            btn.style.display = 'none';
                        }
                    }

                    selectedPiece = null;

                    // Final check to see if the defensive move accidentally scored a computer win
                    const winner = checkWinner();
                    if (winner) {
                        isGameOver = true;
                        document.getElementById('status-display').textContent = "Game Over! Computer won!";
                        document.getElementById('new-game-button').style.display = 'block';
                        console.log("Game over. Computer won");
                        return;
                    }

                    // Hand the turn securely back to the human player
                    currentPlayer = 'player';

                    document.getElementById('status-display').textContent = "Your turn";
                    console.log("Human player's turn now");

                    return;
                }
            }
        }
    }

    // STAGE 3: DEFAULT MOVE (Select the first available legal cell and piece if no immediate threat or win exists)
    for (let cellIndex = 0; cellIndex < 9; cellIndex ++) {
        for (let btn of computerBtn) {
            
            // Skip inventory buttons that have already been used and hidden
            if (btn.style.display === 'none') continue;

            const size = parseInt(btn.getAttribute('data-size'));

            // Verify if the move follows the basic game rules
            if (isValidMove(cellIndex, size, 'computer')) {
                console.log(`Tietokone valitsi ruudun ${cellIndex} ja koon ${size}`);

                // Store the selected piece data in memory
                selectedPiece = {
                    element: btn,
                    size: size
                };

                const targetCell = document.querySelector(`#board .cell[data-index="${cellIndex}"]`);
                if (targetCell) {
                    // Capture logic: If target cell has human player's piece, return it to inventory
                    if (board[cellIndex].player === 'player') {
                        const eatedSize = board[cellIndex].size;
                        const playerBtn = document.querySelectorAll(`#player-inventory button[data-size="${eatedSize}"]`);
                        for (let pBtn of playerBtn) {
                            if (pBtn && pBtn.style.display === 'none') {
                                pBtn.style.display = 'flex';
                                break;
                            }
                        }
                        const historyIndex = moveHistory.findIndex(move => move.cellIndex === cellIndex && move.player === 'player');
                        if (historyIndex !== -1) {
                            moveHistory.splice(historyIndex, 1);
                        }
                    }
                    // Execute the official move to memory and history tracking
                    board[cellIndex] = {player: 'computer', size: size};
                    moveHistory.push({cellIndex: cellIndex, player: 'computer', size: size});
                    
                    // Render the computer's piece visually on the board
                    targetCell.setAttribute('data-player', 'computer');
                    targetCell.setAttribute('data-cell-size', size);

                    if(btn) {
                        btn.style.display = 'none';
                    }
                }

                selectedPiece = null;

                // Final check to see if the default move scored a computer win
                const winner = checkWinner();
                if (winner) {
                    isGameOver = true;
                    document.getElementById('status-display').textContent = "Game Over! Computer won!";
                        document.getElementById('new-game-button').style.display = 'block';
                    console.log("Game over. Computer won.");
                    return;
                }
                // Hand the turn securely back to the human player
                currentPlayer = 'player';

                document.getElementById('status-display').textContent = "Your turn";
            
                console.log("Human player's turn now");

            
                return;
            }
        }
    }
}

// Evaluate the board to check if any player has formed a winning line
function checkWinner() {
    const winningLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], 
        [0, 3, 6], [1, 4, 7], [2, 5, 8], 
        [0, 4, 8], [2, 4, 6]             
    ];

    // Iterate through all 8 possible winning combinations
    for (let line of winningLines) {
        const [a, b, c] = line;

        const cellA = board[a];
        const cellB = board[b];
        const cellC = board[c];

        // If the first cell is occupied and all three cells share the exact same owner
        if (cellA.player !== null &&
            cellA.player === cellB.player &&
            cellA.player === cellC.player) {

                // Return the winning player's identifier ('player' or 'computer')
                return cellA.player;
        }
    }
    // Return null if no winning line is formed on this turn
    return null;
}
// Automatically return the oldest piece to inventory if player runs out of pieces
function handleOldestPieceReturn(activePlayer) {
    const inventoryId = (activePlayer === 'player') ? 'player-inventory' : 'computer-inventory';
    const visibleBtn = document.querySelectorAll(`#${inventoryId} button:not([style*="display: none"])`);

    // If there is more than 1 piece left in inventory, no return is needed
    if (visibleBtn.length > 1) {
        return;
    }

    console.log(`Player ${activePlayer} has only 1 piece left in inventory! Returning the oldest piece...`);

    // Find the longest-standing move on the board for the active player
    const oldestMoveIndex = moveHistory.findIndex(move => move.player === activePlayer);

    // Safety check: If no pieces are found on the board, abort the execution
    if (oldestMoveIndex === -1) {
        return;
    }

    const oldestMove = moveHistory[oldestMoveIndex];
    const cellIndex = oldestMove.cellIndex;
    const pieceSize = oldestMove.size;

    // Remove the piece data from internal board grid memory
    board[cellIndex] = {player: null, size: null};

    // Remove the move entry from the history timeline array
    moveHistory.splice(oldestMoveIndex, 1);

    // Wipe the visual attributes from the HTML board cell element
    const targetCell = document.querySelector(`#board .cell[data-index="${cellIndex}"]`);
    if (targetCell) {
        targetCell.setAttribute('data-player', '');
        targetCell.setAttribute('data-cell-size', '');
    }

    // Restore the corresponding hidden button back to the player's inventory list
    const buttons = document.querySelectorAll(`#${inventoryId} button[data-size="${pieceSize}"]`);
    for (let btn of buttons) {
        if (btn.style.display === 'none') {
            btn.style.display = 'flex';
            break;
        }
    }
}

// Global event listener for restarting the game via Event Delegation
document.addEventListener('click', (event) => {

    // Execute reset only if the clicked element is the designated new game button
    if (event.target && event.target.id === 'new-game-button') {
        
        // Wipe internal game board grid memory and state variables
        board = board.map(() => ({player: null, size: null}));
        moveHistory = [];
        isGameOver = false;
        currentPlayer = 'player';
        selectedPiece = null;

        // Wipe all visual state attributes from the HTML board cells
        boardCells.forEach(cell => {
            cell.setAttribute('data-player', '');
            cell.setAttribute('data-cell-size', '');
        });

        // Restore all 12 inventory buttons back to visible flex display and clear highlights
        const allButtons = document.querySelectorAll('#player-inventory button, #computer-inventory button');
        allButtons.forEach(btn => {
            btn.style.display = 'flex';
            btn.classList.remove('selected');
        });

        // Reset the visual status text and hide the new game button once clicked
        document.getElementById('status-display').textContent = "Your turn";
        
        event.target.style.display = 'none';

        console.log("A new game has been successfully initialized");
    }
});
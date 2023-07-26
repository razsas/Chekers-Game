window.onload = () =>{
    createBoard();} 
let board;
let blacksTurn= true;
let selectedPiece= null;
let ateLastTurn = false;
let gameOver = false;
let dragedPiece = null;
const optionToMove= [];
const killListForJump= [];
const piecesInDanger = [];
const paths = [];
const boardElement = document.getElementById('checkers_board');
const modal = document.getElementById('game-over-screen');
const modalText = document.getElementById('modalBox');
const turnsClock = document.getElementById('currentTurn');
const buttonYes = document.getElementById('yes_button');
const buttonNo = document.getElementById('no_button');
function createBoard(){//0-empty, 1-white, 2-black
    board =[[0, 2, 0, 2, 0, 2, 0, 2],[2, 0, 2, 0, 2, 0, 2, 0],[0, 2, 0, 2, 0, 2, 0, 2]
    ,[0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0],[1, 0, 1, 0, 1, 0, 1, 0]
    ,[0, 1, 0, 1, 0, 1, 0, 1],[1, 0, 1, 0, 1, 0, 1, 0]];
    blacksTurn = true;
    gameOver = false;          
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const squareElement = document.createElement('div');
            const pieceElement = document.createElement('div');
            squareElement.className = (row + col) % 2 === 0 ? 'white-cell' : 'brown-cell';
            squareElement.id = ""+(row*8+col);
            pieceElement.id = "pr"+row+"c"+col;
            pieceElement.draggable='true';
            boardElement.appendChild(squareElement);
            if (row <3 && (row + col) % 2 === 1){
                pieceElement.className = 'piece piece-black';
                squareElement.appendChild(pieceElement);
            }
            else if (row >4 && (row + col) % 2 === 1){
                pieceElement.className = 'piece piece-white';
                squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("drop", function(event) {
                const cell = document.getElementById(event.target.id);
                if (cell.classList.contains('glow-cell') && dragedPiece===selectedPiece){
                    event.preventDefault();
                    cell.appendChild(dragedPiece);
                    commitOption(cell.id);
                }
            })
            squareElement.addEventListener("dragover",(event) => {
                event.preventDefault();
            })
            pieceElement.addEventListener("dragstart", function(event) {
                dragedPiece = document.getElementById(event.target.id);
                checkPossibleOptions(parseInt(dragedPiece.id[2]),parseInt(dragedPiece.id[4]));
            })
            squareElement.addEventListener("click", function(event){
                commitOption(event.target.id);
            });
            pieceElement.addEventListener("click", function(event){
                checkPossibleOptions(parseInt(event.target.id[2]),parseInt(event.target.id[4]));
            });
        }
    }
}
function restartBoard() {
    window.location.reload();
}
function toResign(){
    modalText.innerHTML= blacksTurn ? "black forfeits, white has won" : "white forfeits, black has won";
    modal.style.display="flex";
    gameOver = true;
    turnsClock.innerHTML = blacksTurn?'game over : white has won':'game over : black has won';
}
window.onclick = function(event) {
    if (event.target === modal.firstElementChild) {
        modal.style.display = "none";
    }
}
function askDraw(){
    modalText.innerHTML= blacksTurn ? "white player, black offers a draw, do you accept?" : "black player, white offers a draw, do you accept?";
    modal.style.display="flex";
    buttonYes.style.display="block";
    buttonNo.style.display="block";
}
function acceptDraw(){
    modalText.innerHTML= "draw is accepted on both players, game is over";
    buttonYes.style.display="none";
    buttonNo.style.display="none";
    gameOver = true;
    turnsClock.innerHTML = 'game over : draw';
}
function refuseDraw(){
    modalText.innerHTML= "draw is refused";
    buttonYes.style.display="none";
    buttonNo.style.display="none";
}
function isGameOver(){
    const colorCode = blacksTurn?2:1;
    const kingColorCode = blacksTurn?4:3;
    for (let i = 0; i<8; i++){
        for (let j = 0; j<8; j++){
            if (board[i][j] === colorCode || board[i][j] === kingColorCode){
                checkPossibleOptions(i,j,false);
                if (optionToMove.length !=0){
                    optionToMove.slice(0,optionToMove.length);
                    return false;
                }
                else{
                    optionToMove.slice(0,optionToMove.length);
                }  
            }
        }
    }
    return true;
}
function passTurn(){
    if (piecesInDanger.length != 0 && !ateLastTurn){
        while (piecesInDanger.length != 0){
            let killedElement = piecesInDanger.pop();
            board[killedElement.id[2]][killedElement.id[4]]=0;
            killedElement.remove(); 
        }
    }
    blacksTurn = !blacksTurn
    turnsClock.innerHTML = blacksTurn?'black turn':'white turn';
    promoteKing();
    emptyList(killListForJump); 
    findPiecesInDanger();
    if (isGameOver()){
        modalText.innerHTML= blacksTurn ? "black has no moves, white has won" : "white has no moves, black has won";
        modal.style.display="flex";
        gameOver = true;
        turnsClock.innerHTML = blacksTurn?'game over : white has won':'game over : black has won';
    }
}
function emptyList(list){
    while (list.length>0){
        list.pop();
    }
}
function removeGlowing(){
    if (selectedPiece != null)
        selectedPiece.classList.remove("glow-piece");
    while (optionToMove.length != 0){
        let glowRemove = optionToMove.pop();
        glowRemove.classList.remove('glow-cell');
    }
}
function addGlowing(){
    if (selectedPiece != null)
        selectedPiece.classList.add("glow-piece");
    optionToMove.forEach(cell => {
        cell.classList.add("glow-cell");
    })
}
function findPiecesInDanger(){
    for (let i = 0; i<8; i++){
        for (let j = 0; j<8; j++){
            emptyList(paths);
            emptyList(optionToMove);
            const colorCode = blacksTurn? 2:1;
            const kingColorCode = blacksTurn?4:3;
            if (colorCode === board[i][j]&& isJumpAble(i,j))
                piecesInDanger.push(document.getElementById('pr'+i+'c'+j));
            else if(kingColorCode === board[i][j]){
                checkWalkOptions(i,j,kingColorCode);
                kingEatingOptionExtender(i,j);
                if (isJumpAble(i,j) || paths.length>0)
                    piecesInDanger.push(document.getElementById('qr'+i+'c'+j));
            }    
        }
    }
    emptyList(paths);
    emptyList(optionToMove);
}
function promoteKing(){
    const crownPictureElement = document.createElement('img');
    crownPictureElement.src = "./crown.png";
    crownPictureElement.style.width='98%';
    for (let i=0; i<8; i++){
        if (board[0][i]===1){
            let crownedPiece = document.getElementById('pr0c'+i);
            crownedPiece.classList.add('queen');
            crownedPiece.id = 'qr0c'+i;
            board[0][i]=3;
            crownedPiece.appendChild(crownPictureElement);
        }
        if (board[7][i]===2){
            let crownedPiece = document.getElementById('pr7c'+i);
            crownedPiece.classList.add('queen');
            crownedPiece.id = 'qr7c'+i;
            board[7][i]=4;
            crownedPiece.appendChild(crownPictureElement);
        }
    }
}
function isJumpAble(x,y,chosenBoard=board){
    if (chosenBoard[x][y]===3 || chosenBoard[x][y]===4){
        return (isJumpAbleForwardLeft(x,y,chosenBoard)||isJumpAbleBackwardsLeft(x,y,chosenBoard)||isJumpAbleForwardRight(x,y,chosenBoard)||isJumpAbleBackwardsRight(x,y,chosenBoard));
    }  
    else{
        if (blacksTurn){
            return (isJumpAbleForwardLeft(x,y,chosenBoard)||isJumpAbleForwardRight(x,y,chosenBoard));
        }
        else{
            return (isJumpAbleBackwardsLeft(x,y,chosenBoard)||isJumpAbleBackwardsRight(x,y,chosenBoard));
        }
    }         
}
function isJumpAbleForwardLeft(xPiece,yPiece,chosenBoard=board){
    const colorCode = blacksTurn? 1:2;
    const kingColorCode = blacksTurn?3:4;
    if(xPiece>5 || yPiece<2){
        return false;
    }
    else if ((chosenBoard[xPiece+1][yPiece-1]===colorCode ||chosenBoard[xPiece+1][yPiece-1]===kingColorCode) && chosenBoard[xPiece+2][yPiece-2]===0)
        return true;   
    else return false;
}
function isJumpAbleBackwardsLeft(xPiece,yPiece,chosenBoard=board){
    const colorCode = blacksTurn? 1:2;
    const kingColorCode = blacksTurn?3:4;
    if(xPiece<2 || yPiece<2){
        return false;
    }
    else if ((chosenBoard[xPiece-1][yPiece-1]===colorCode ||chosenBoard[xPiece-1][yPiece-1]===kingColorCode) && chosenBoard[xPiece-2][yPiece-2]===0)
        return true;
    else return false;    
}
function isJumpAbleForwardRight(xPiece,yPiece,chosenBoard=board){
    const colorCode = blacksTurn? 1:2;
    const kingColorCode = blacksTurn?3:4;
    if(xPiece>5 || yPiece>5){
        return false;
    }
    else if ((chosenBoard[xPiece+1][yPiece+1]===colorCode ||chosenBoard[xPiece+1][yPiece+1]===kingColorCode) && chosenBoard[xPiece+2][yPiece+2]===0)
        return true;   
    else return false;
}
function isJumpAbleBackwardsRight(xPiece,yPiece,chosenBoard=board){
    const colorCode = blacksTurn? 1:2;
    const kingColorCode = blacksTurn?3:4;
    if(xPiece<2 || yPiece>5){
        return false;
    }
    else if ((chosenBoard[xPiece-1][yPiece+1]===colorCode ||chosenBoard[xPiece-1][yPiece+1]===kingColorCode) && chosenBoard[xPiece-2][yPiece+2]===0)
        return true;
    else return false;    
}
function checkPossibleOptions(xPiece,yPiece,addGlow=true){///change name
    const colorCode = blacksTurn? 2:1;
    const kingColorCode = blacksTurn?4:3;
    if ((board[xPiece][yPiece] === colorCode || board[xPiece][yPiece]===kingColorCode) && !gameOver) {
        if (optionToMove.length != 0 || selectedPiece != null)
            removeGlowing();
        let firstletter = '';
        if (board[xPiece][yPiece]===1||board[xPiece][yPiece]===2)
            firstletter='p';
        else
            firstletter='q';
        selectedPiece = document.getElementById(firstletter+'r'+xPiece+'c'+yPiece);
        if (board[xPiece][yPiece]===kingColorCode){
            checkWalkOptions(xPiece,yPiece,kingColorCode);
            kingEatingOptionExtender(xPiece,yPiece);
        }
        checkEatingOptions(xPiece,yPiece,board[xPiece][yPiece]);
        if (board[xPiece][yPiece]===colorCode){
            checkWalkOptions(xPiece,yPiece,colorCode);
        }
        if (addGlow)
            addGlowing();
    }
}
function checkWalkOptions(xPiece,yPiece,colorCode){
    if(colorCode===2){
        for (let i=0;i<2;i++){
            if (yPiece != 0+i*7 && (yPiece-1+2*i)<8 && (yPiece-1+2*i)>-1 && board[xPiece+1][yPiece-1+2*i]===0){
                let cellForCellList = document.getElementById(''+((8*(xPiece+1))+(yPiece-1+2*i)));
                optionToMove.push(cellForCellList);
            }
        }
    }
    else if (colorCode===1){
        for (let i=0;i<2;i++){
            if (yPiece != 0+7*i && board[xPiece-1][yPiece-1+2*i]===0){
                let cellForCellList = document.getElementById(''+((8*(xPiece-1))+(yPiece-1+2*i)));
                optionToMove.push(cellForCellList);
            }
        }
    }
    else{
        for (let j=0;j<4;j++){
            let xDirection = (j === 0 || j === 1)?1:-1;
            let yDirection = (j === 0 || j === 3)?1:-1;
            for (let i=1;i<8;i++){
                if(isDiagonalFree(xPiece,yPiece,xDirection,yDirection,i)){
                    let cellForCellList = document.getElementById(''+((8*(xPiece+(xDirection*i)))+(yPiece+(yDirection*i))));
                    optionToMove.push(cellForCellList);
                }
            }
        }   
    }
}
function isDiagonalFree(xPiece,yPiece,xDirection,yDirection,steps){
    for (let i=1;i<steps+1;i++){
        if ((xPiece+(i*xDirection))>7||(xPiece+(i*xDirection))<0||(yPiece+(i*yDirection))>7||(yPiece+(i*yDirection))<0||board[xPiece+(i*xDirection)][yPiece+(i*yDirection)]!=0){
            return false;
        }
    }
    return true;
}
function commitOption(id){
    const cell = document.getElementById(id);
    if (cell.className.search('glow-cell')===-1 || selectedPiece == null);
    else{
        let indexOfMove = optionToMove.indexOf(cell);
        let xPiece = parseInt(selectedPiece.id[2]);
        let yPiece= parseInt(selectedPiece.id[4]);
        let xTarget = Math.floor(parseInt(cell.id)/8);
        let yTarget = parseInt(cell.id)%8;
        if (killListForJump[indexOfMove]!= null){
            killPieces(indexOfMove);
            ateLastTurn=true;
            while (piecesInDanger.length>0)
                piecesInDanger.pop();
        }
        else if(killListForJump[indexOfMove]== null){
            ateLastTurn = false;
            killPieces(indexOfMove);
        }
        board[xTarget][yTarget] = board[xPiece][yPiece];
        board[xPiece][yPiece] = 0;
        cell.appendChild(selectedPiece.parentElement.removeChild(selectedPiece));
        selectedPiece.id =selectedPiece.id[0]==='q'?'qr'+xTarget+'c'+yTarget :'pr'+xTarget+'c'+yTarget;
        removeGlowing();
        passTurn();
        selectedPiece = null;
    }
}
function killPieces(index){
    let killCommand = killListForJump[index];
    while(killCommand!=null&&killCommand.length>0){
        let xPiece = killCommand[1];
        let yPiece = killCommand[2];
        let pieceCode = (board[xPiece][yPiece] === 1 || board[xPiece][yPiece] === 2)?'p':'q';
        killCommand = killCommand.slice(3);
        let killedElement = document.getElementById(pieceCode+'r'+xPiece+'c'+yPiece);
        board[xPiece][yPiece]=0;
        if (killedElement != null)
            killedElement.remove(); 
    }
}
function checkEatingOptions(xPiece,yPiece,pieceType){ 
    // const right = 'r';
    emptyList(killListForJump);
    let killStringForList = '';
    addToPathList(xPiece,yPiece);
    while(paths.length>0){
        killStringForList = ''
        let path=paths.pop();
        let steps = 0;
        let tempPath = path;
        let direction = null;
        if (path.length%2===1){
            steps=parseInt(tempPath[0]);
            tempPath = tempPath.slice(1);
        }
        xPiece=parseInt(tempPath[0]);
        yPiece=parseInt(tempPath[1]);
        tempPath = tempPath.slice(2);
        direction = findDirection(tempPath);
        xPiece+=(steps*direction[0]);
        yPiece+=(steps*direction[1]);
        let xEaten=0;
        let yEaten=0;
        let tempBoard = copyBoard(); 
        while(tempPath.length>0){
            tempBoard[xPiece][yPiece]=0;
            direction = findDirection(tempPath);
            if (direction[0]===1){
                xEaten=xPiece+1;
                xPiece+=2;
            }
            else{
                xEaten=xPiece-1;
                xPiece-=2;
            }
            if (direction[1]===1){
                yEaten=yPiece+1;
                yPiece+=2;
            }
            else{
                yEaten=yPiece-1;
                yPiece-=2;
            }
            tempPath = tempPath.slice(2);
            tempBoard[xEaten][yEaten]=0;
            killStringForList += 'z'+xEaten+yEaten;
            tempBoard[xPiece][yPiece]=pieceType;
        }
        if (isJumpAble(xPiece,yPiece,tempBoard)){
            addToPathList(xPiece,yPiece,tempBoard,path);
        }
        else{
            optionToMove.splice(0, 0, document.getElementById(''+(8*(xPiece)+yPiece)));
            killListForJump.splice(0, 0, killStringForList);
        } 
    }
}
function findDirection(path){//1-fr,2-fl,3-bl,4-br
    let xDirection,yDirection;
    if (path[0]==='f' && path[1]==='r'){
        xDirection=1;
        yDirection=1;
    }
    else if(path[0]==='f' && path[1]==='l'){
        xDirection=1;
        yDirection=-1;
    }
    else if(path[0]==='b' && path[1]==='l'){
        xDirection=-1;
        yDirection=-1;
    }  
    else{
        xDirection=-1;
        yDirection=1;
    }
    return [xDirection,yDirection];
}
function kingEatingOptionExtender(xPiece,yPiece){
    optionToMove.forEach(cell => { //nedds to only check the direction we are coming from and create a path if jumpable 
        let xTarget = Math.floor(parseInt(cell.id/8));
        let yTarget = parseInt(cell.id%8);
        let isXIncreased = xPiece-xTarget<0?true:false;
        let isYIncreased = yPiece-yTarget<0?true:false;
        let steps = Math.abs(xPiece-xTarget);
        if(isXIncreased){
            if (isYIncreased && isJumpAbleForwardRight(xTarget,yTarget))
                paths.push(steps+''+xPiece+''+yPiece+'fr');
            else if(!isYIncreased && isJumpAbleForwardLeft(xTarget,yTarget))
                paths.push(steps+''+xPiece+''+yPiece+'fl');
        }
        else{
            if (isYIncreased && isJumpAbleBackwardsRight(xTarget,yTarget))
                paths.push(steps+''+xPiece+''+yPiece+'br');
            else if (!isYIncreased && isJumpAbleBackwardsLeft(xTarget,yTarget))
                paths.push(steps+''+xPiece+''+yPiece+'bl');
        }
    })
}      
function addToPathList(x,y,tempBoard=board,oldPath=""){//0-all,1 ++,2 +-, 3 --,4 -+
    const kingColorCode = blacksTurn?4:3;
    if(isJumpAbleForwardRight(x,y) && (tempBoard[x][y] === 2||tempBoard[x][y] === kingColorCode)){
        if (oldPath==='')
            paths.push(x+''+y+'fr');
        else
            paths.push(oldPath+'fr');
    }
    if(isJumpAbleForwardLeft(x,y) && (tempBoard[x][y] === 2||tempBoard[x][y] === kingColorCode)){
        if (oldPath==='')
            paths.push(x+''+y+'fl'); 
        else
            paths.push(oldPath+'fl');
    }
    if(isJumpAbleBackwardsLeft(x,y) && (tempBoard[x][y] === 1||tempBoard[x][y] === kingColorCode)){
        if (oldPath==='')
            paths.push(x+''+y+'bl');
        else
            paths.push(oldPath+'bl');
    }
    if(isJumpAbleBackwardsRight(x,y) && (tempBoard[x][y] === 1||tempBoard[x][y] === kingColorCode)){
        if (oldPath==='')
            paths.push(x+''+y+'br'); 
        else
            paths.push(oldPath+'br');
    }
}  
function copyBoard(){
    let copy = [];
    board.forEach(line => {
        let line2 = [...line];
        copy.push(line2);
    })
    return copy;
}
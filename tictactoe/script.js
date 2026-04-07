/// ici je récupère les éléments de mon html pour pouvoir les manipuler dans mon js
const board = document.getElementById("board");
const cells = document.querySelectorAll(".cell");
const message = document.getElementById("message");
const resetBtn = document.getElementById("reset");
/// J'initialise les variables pour suivre l'état du jeu
let currentPlayer = "X"; 
let gameActive = true; /// si on veut continuer à jouer ou pas (si quelqu'un a gagné ou égalité)
let gameState = ["", "", "", "", "", "", "", "", ""]; /// c'est l'état du plateau
/// Je définis les conditions de victoire pour le jeu de morpion (en gros 3 alignés)
const winningConditions = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
];
/// mise en place du clic sur les cellules 
function handleCellClick(e) {
  const clickedCell = e.target; /// je récupère la cellule qui a été cliquée pour pouvoir la mettre à jour
  const clickedIndex = parseInt(clickedCell.getAttribute("data-index")); /// je récupère l'index de la cellule cliquée pour pouvoir mettre à jour le gameState
/// vérification et on arrête la fonction si la cellule est déjà remplie ou si le jeu n'est plus actif 
  if (gameState[clickedIndex] !== "" || !gameActive) return;
/// maj du tableau de jeu 
  gameState[clickedIndex] = currentPlayer;
  clickedCell.textContent = currentPlayer;
/// vérification du résultat après chaque coup
  checkResult();
}
/// fonction pour vérifier si quelqu'un a gagné ou s'il y a égalité
function checkResult() {
  let roundWon = false;
  for (let i = 0; i < winningConditions.length; i++) {
    const [a, b, c] = winningConditions[i];
    if (gameState[a] === "" || gameState[b] === "" || gameState[c] === "") continue;
    if (gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    message.textContent = `Le joueur ${currentPlayer} a gagné !`;
    gameActive = false;
    return;
  }

  if (!gameState.includes("")) {
    message.textContent = "Égalité !";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  message.textContent = `Joueur ${currentPlayer}, à toi de jouer`;
}

function resetGame() {
  gameState = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;
  message.textContent = `Joueur ${currentPlayer}, à toi de jouer`;
  cells.forEach(cell => cell.textContent = "");
}

cells.forEach(cell => cell.addEventListener("click", handleCellClick));
resetBtn.addEventListener("click", resetGame);

// Message initial
message.textContent = `Joueur ${currentPlayer}, à toi de jouer`;

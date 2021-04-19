/************Copy Game ID************/
const copyGameID = () => {
  const textToCopy = document.getElementById("gameId").innerText;

  const myTemporaryInputElement = document.createElement("input");
  myTemporaryInputElement.type = "text";
  myTemporaryInputElement.value = textToCopy;

  document.body.appendChild(myTemporaryInputElement);

  myTemporaryInputElement.select();
  document.execCommand("Copy");

  document.body.removeChild(myTemporaryInputElement);
};

export default copyGameID;

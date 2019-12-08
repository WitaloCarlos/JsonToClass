const generateAndPlot = () => {

    const content = document.getElementById("txtRawJson");

    if (content) {
        const inputName = document.getElementById("className");

        if (content.value && inputName.value) {

            parse(JSON.parse(content.value), inputName.value);

            const engine = document.getElementById('buildEngine');
            const engineVal = engine.options[engine.selectedIndex].value;

            console.log(engine.options[engine.selectedIndex].value);
            const generatedClass = generate(engineVal);

            const divRes = document.getElementById("divResults");

            const preDiv = document.createElement("div");
            preDiv.id = "codeBlock"
            const preContent = document.createElement("pre");
            preContent.className += ' preContent';
            preContent.innerText = generatedClass;

            preDiv.appendChild(preContent);
            document.body.insertBefore(preDiv, divRes);
        }

    } else {
        alert('No content');
    }

}

const clearResults = () => {
    resetPool();
    const divRes = document.querySelectorAll("#codeBlock");
    divRes.forEach(el => el.remove());
    const inputName = document.getElementById("className");
    const content = document.getElementById("txtRawJson");
    inputName.value = '';
    content.value = '';
}

const btnGenerate = document.getElementById("btnGenerate");
const btnClear = document.getElementById("btnClear");

btnGenerate.addEventListener('click', generateAndPlot);
btnClear.addEventListener('click', clearResults);
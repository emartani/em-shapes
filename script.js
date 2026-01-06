document.addEventListener("DOMContentLoaded", () => {
    const namesContainer = document.getElementById("nomes-roupas");
    const imagesContainer = document.getElementById("imagens-roupas");
    const scoreDisplay = document.getElementById("score");
    const errorDisplay = document.getElementById("errors");
    const resetButton = document.getElementById("reset");
    const fireworksContainer = document.getElementById("fireworks-container");
    const successAudio = new Audio('success.mp3'); // Certifique-se de ter este arquivo
    // Adicionar áudios para acerto e erro
    const correctDropAudio = new Audio('acerto.mp3'); // Certifique-se de ter este arquivo
    const incorrectDropAudio = new Audio('erro.mp3'); // Certifique-se de ter este arquivo

    const congratulationMessage = document.createElement("div");
    congratulationMessage.id = "congratulation-message";
    congratulationMessage.style.display = "none";
    congratulationMessage.innerHTML = "🎉 Parabéns! Você acertou tudo! 🥳";
    document.body.appendChild(congratulationMessage);

    let score = 0;
    let errors = 0;
    const maxErrors = 3;
    const totalItems = 7; //
    let correctlyAnsweredCount = 0; // Adicionado para rastrear acertos totais para a condição de vitória
    const nameToImageMap = {};
    const itemsPerStage = 7;
    const totalStages = 1;
    let currentStage = 1; // Começa na Etapa 1
    let stageCorrectlyAnswered = 0; // Conta acertos dentro da etapa atual

    const translations = {
        "Circle": "images/1.png",
        "Triangle": "images/2.png",
        "Rectangle": "images/3.png",
        "Oval": "images/4.png",
        "Heart": "images/5.png",
        "Square": "images/6.png",
        "Star": "images/7.png"
    };

    const nameColors = ["color-1", "color-2", "color-3", "color-4", "color-5", "color-6", "color-7", "color-8", "color-9", "color-10", "color-11", "color-12", "color-13", "color-14", "color-15", "color-16"];

    function cleanId(text) {
        return text.toLowerCase().replace(/-/g, "");
    }

    // Função para detectar dispositivo móvel (igual à que havíamos discutido)
    function isMobileDevice() {
        return window.matchMedia("(max-width: 480px)").matches; //
    }

    function initializeGame() {
        
        // 1. Limpa e reconstrói o mapa de correspondência a cada reinício
        // (A remoção do for...in é feita aqui se nameToImageMap for global e for preciso resetá-lo)
        // Se nameToImageMap for um objeto global no seu escopo:
        /*
        for (const key in nameToImageMap) {
            delete nameToImageMap[key];
        }
        */

        // Popula o mapa: ID do Nome (texto limpo) -> ID da Imagem (número limpo)
        // Isso é importante para a lógica de match em handleDrop.
        // Se o mapa não for limpo acima, este loop apenas o reconstrói.
        for (const name in translations) {
            const imageName = translations[name].split('/').pop().split('.')[0];
            nameToImageMap[cleanId(name)] = cleanId(imageName);
        }

        fireworksContainer.style.display = "none";
        congratulationMessage.style.display = "none";
        
        // Reinicia o jogo por completo se estiver na primeira etapa
        if (currentStage === 1) { 
            score = 0;
            errors = 0;
            correctlyAnsweredCount = 0; // Resetar acertos totais
        }

        stageCorrectlyAnswered = 0; // Resetar acertos da etapa atual
        updateScore();

        // Pausar e reiniciar áudios
        successAudio.pause(); successAudio.currentTime = 0;
        correctDropAudio.pause(); correctDropAudio.currentTime = 0;
        incorrectDropAudio.pause(); incorrectDropAudio.currentTime = 0;

        let allClothingNames = Object.keys(translations);
        let allImagePaths = Object.values(translations);
        
        // LÓGICA DE SELEÇÃO DA ETAPA
        // 1. Calcula o índice de início e fim da etapa atual (currentStage)
        const startIndex = (currentStage - 1) * itemsPerStage;
        const endIndex = currentStage * itemsPerStage;
        
        // 2. Cria arrays para a etapa atual, fatiando (slicing) a lista completa
        let clothingNames = allClothingNames.slice(startIndex, endIndex);
        let imagePaths = allImagePaths.slice(startIndex, endIndex);
        
        // 3. Embaralha apenas os itens da etapa atual
        shuffleArray(clothingNames);
        shuffleArray(imagePaths);
        // Note: shuffleArray(nameColors) foi removido aqui para manter as cores estáveis por índice global, 
        // mas você pode mantê-lo se quiser cores aleatórias por etapa.

        namesContainer.innerHTML = "";
        imagesContainer.innerHTML = "";

        // Cria os nomes (arrastáveis)
        clothingNames.forEach((name, index) => {
            const nameElement = document.createElement("div");
            nameElement.classList.add("clothing-name");
            nameElement.id = cleanId(name);
            nameElement.draggable = true;
            nameElement.textContent = capitalizeFirstLetter(name.replace(/-/g, " "));

            // Usa a cor baseada no índice global (startIndex + index)
            nameElement.classList.add(nameColors[startIndex + index]);

            addDragEvents(nameElement);
            namesContainer.appendChild(nameElement);
        });

        // Cria as zonas de drop (imagens)
        imagePaths.forEach(path => {
            const dropZone = document.createElement("div");
            dropZone.classList.add("drop-zone-image");

            const fileName = path.split('/').pop().split('.')[0];
            dropZone.id = cleanId(fileName);

            const imgElement = document.createElement("img");
            imgElement.src = path;
            imgElement.alt = fileName.replace(/-/g, " ");
            imgElement.classList.add("clothing-image");

            dropZone.appendChild(imgElement);
            imagesContainer.appendChild(dropZone);

            // Garante que elementos reiniciados estejam visíveis
            dropZone.classList.remove('disappear-item');
            imgElement.style.opacity = '1';
        });

        addDropEvents();
    }

    function addDragEvents(element) {
        element.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text", event.target.id);
            event.target.classList.add('is-dragging');
        });

        element.addEventListener("dragend", (event) => {
            event.target.classList.remove('is-dragging');
        });
    }

    function addDropEvents() {
        document.querySelectorAll(".drop-zone-image").forEach(zone => {
            // Remove listeners existentes para evitar duplicação em initializeGame
            zone.removeEventListener("dragover", handleDragOver);
            zone.removeEventListener("dragleave", handleDragLeave);
            zone.removeEventListener("drop", handleDrop);

            // Adiciona os event listeners novamente
            zone.addEventListener("dragover", handleDragOver);
            zone.addEventListener("dragleave", handleDragLeave);
            zone.addEventListener("drop", handleDrop);
        });
    }

    function handleDragOver(event) {
        event.preventDefault();
        const zone = event.target.closest(".drop-zone-image");
        if (zone) {
            zone.classList.add("drag-over");
        }
    }

    function handleDragLeave(event) {
        const zone = event.target.closest(".drop-zone-image");
        if (zone) {
            zone.classList.remove("drag-over");
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const targetZone = event.target.closest(".drop-zone-image");

        if (!targetZone) return;

        targetZone.classList.remove("drag-over");

        if (targetZone.querySelector(".clothing-name-dropped")) {
            return; // Já tem um nome dropado aqui
        }

        const draggedNameId = event.dataTransfer.getData("text");
        const draggedNameElement = document.getElementById(draggedNameId);

        if (!draggedNameElement) { // Verifica se o elemento arrastado ainda existe
            return;
        }

        const targetImageId = targetZone.id;

        // --- VERIFICAÇÃO DE ACERTO USANDO O MAPA ---
        if (nameToImageMap[draggedNameId] === targetImageId) {
            
            // Se for um dispositivo móvel: faz a imagem e o nome arrastado desaparecerem
            if (isMobileDevice()) {
                targetZone.classList.add('disappear-item');
                draggedNameElement.remove();

                setTimeout(() => {
                    if (targetZone && targetZone.parentNode) {
                        targetZone.parentNode.removeChild(targetZone); // Remove a imagem completamente
                    }
                }, 500); // Tempo da transição CSS (0.5s)

            } else {
                // Comportamento para desktop: move o nome para a imagem
                draggedNameElement.remove();

                const droppedNameDisplay = document.createElement("div"); 
                droppedNameDisplay.classList.add("clothing-name-dropped"); 
                const originalNameKey = Object.keys(translations).find(key => cleanId(key) === draggedNameId); 
                droppedNameDisplay.textContent = capitalizeFirstLetter(originalNameKey.replace(/-/g, " ")); 

                targetZone.appendChild(droppedNameDisplay); 
                targetZone.style.backgroundColor = "#90EE90"; // Light green for correct
            }

            score++;
            correctDropAudio.play(); // Tocar som de acerto
            correctlyAnsweredCount++; // Incrementa o contador de acertos totais
            stageCorrectlyAnswered++; // NOVO: Incrementa o contador da etapa atual

            // Desabilita novas drops nesta zona
            targetZone.removeEventListener("dragover", handleDragOver);
            targetZone.removeEventListener("dragleave", handleDragLeave);
            targetZone.removeEventListener("drop", handleDrop);

            // LÓGICA DE TRANSIÇÃO DE ETAPA
            if (stageCorrectlyAnswered === itemsPerStage) {
                if (currentStage < totalStages) {
                    // Avança para a próxima etapa
                    currentStage++;
                    
                    // Adiciona um pequeno delay antes de carregar a próxima etapa
                    setTimeout(() => {
                        alert(`Parabéns! Você completou a Etapa ${currentStage - 1}. Começando a Etapa ${currentStage}!`);
                        initializeGame(); // Inicia a próxima etapa
                    }, 500); 

                } else if (currentStage === totalStages) {
                    // Fim do jogo (todos os 12 itens)
                    showFireworks();
                    successAudio.play();
                    congratulationMessage.style.display = "block";
                    currentStage = 1; // Reseta para a próxima partida
                }
            }

        } else {
            // Bloco de ERRO
            targetZone.style.backgroundColor = "#FF6347"; // Tomato red for incorrect
            setTimeout(() => {
                targetZone.style.backgroundColor = "#dcdcdc"; // Reset color
            }, 1000);

            errors++;
            incorrectDropAudio.play(); // Tocar som de erro

            if (errors >= maxErrors) {
                alert("Você errou 3 vezes! O jogo será reiniciado na Etapa 1.");
                currentStage = 1; // Garante o reset para a Etapa 1
                initializeGame();
                return;
            }
        }
        updateScore();
        if (event.target.classList.contains('is-dragging')) {
            event.target.classList.remove('is-dragging'); // Remove a classe de arrastar do elemento que foi arrastado
        }
    }

    function updateScore() {
        scoreDisplay.textContent = `Acertos: ${score}`;
        errorDisplay.textContent = `Erros: ${errors}`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function showFireworks() {
        fireworksContainer.style.display = "block";

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createFirework();
            }, i * 200);
        }

        setTimeout(() => {
            fireworksContainer.style.display = "none";
        }, 4000);
    }

    function getRandomColor() {
        const colors = ["red", "yellow", "blue", "green", "purple", "orange"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function createFirework() {
        const firework = document.createElement("div");
        firework.classList.add("firework");

        const size = Math.random() * 20 + 10;
        firework.style.width = `${size}px`;
        firework.style.height = `${size}px`;

        firework.style.top = `${Math.random() * window.innerHeight}px`;
        firework.style.left = `${Math.random() * window.innerWidth}px`;

        firework.style.backgroundColor = getRandomColor();

        fireworksContainer.appendChild(firework);

        setTimeout(() => {
            firework.remove();
        }, 1000);
    }

    resetButton.addEventListener("click", initializeGame);
    initializeGame();
});
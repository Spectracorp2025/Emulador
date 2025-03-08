document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const shortcutsContainer = document.getElementById('shortcutsContainer');

    // Cargar accesos directos almacenados
    loadShortcuts();

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.zip')) {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            
            // Extraer todos los archivos
            const files = {};
            for (let filename of Object.keys(content.files)) {
                if (!content.files[filename].dir) {
                    files[filename] = await content.files[filename].async('blob');
                }
            }

            // Buscar el archivo .html principal
            const htmlFile = Object.keys(files).find(name => name.endsWith('.html'));
            if (!htmlFile) {
                alert("El archivo ZIP no contiene un archivo HTML.");
                return;
            }

            const title = htmlFile.replace('.html', '');

            // Crear un acceso directo
            const shortcut = document.createElement('div');
            shortcut.className = 'shortcut';
            shortcut.innerHTML = `
                <span>${title}</span>
                <button>Play</button>
            `;

            // Evento para el botón Play
            shortcut.querySelector('button').addEventListener('click', () => {
                openHTML(files, htmlFile);
            });

            // Añadir al contenedor y guardar en localStorage
            shortcutsContainer.appendChild(shortcut);
            saveShortcut(title, files, htmlFile);
        }
    });

    function saveShortcut(title, files, htmlFile) {
        const storedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        storedShortcuts.push({ title, files, htmlFile });
        localStorage.setItem('shortcuts', JSON.stringify(storedShortcuts));
    }

    function loadShortcuts() {
        const storedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        storedShortcuts.forEach(({ title, files, htmlFile }) => {
            const shortcut = document.createElement('div');
            shortcut.className = 'shortcut';
            shortcut.innerHTML = `
                <span>${title}</span>
                <button>Play</button>
            `;
            shortcut.querySelector('button').addEventListener('click', () => {
                openHTML(files, htmlFile);
            });
            shortcutsContainer.appendChild(shortcut);
        });
    }

    function openHTML(files, htmlFile) {
        const newWindow = window.open();
        const fileURLs = {};

        // Crear URLs temporales para los archivos
        for (let filename in files) {
            fileURLs[filename] = URL.createObjectURL(files[filename]);
        }

        // Leer y modificar el HTML para usar las URLs temporales
        const reader = new FileReader();
        reader.readAsText(files[htmlFile]);
        reader.onload = function () {
            let htmlContent = reader.result;

            // Reemplazar rutas relativas en el HTML
            for (let filename in fileURLs) {
                let escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar caracteres especiales
                htmlContent = htmlContent.replace(new RegExp(escapedFilename, 'g'), fileURLs[filename]);
            }

            // Escribir el HTML modificado en la nueva ventana
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        };
    }
});

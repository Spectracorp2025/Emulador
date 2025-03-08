document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const shortcutsContainer = document.getElementById('shortcutsContainer');

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.zip')) {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);

            // Extraer todos los archivos en memoria
            const files = {};
            for (let filename of Object.keys(content.files)) {
                if (!content.files[filename].dir) {
                    files[filename] = await content.files[filename].async('blob');
                }
            }

            // Buscar el archivo HTML principal
            const htmlFile = Object.keys(files).find(name => name.endsWith('.html'));
            if (!htmlFile) {
                alert("El archivo ZIP no contiene un archivo HTML.");
                return;
            }

            const title = htmlFile.replace('.html', '');

            // Crear acceso directo (NO SE GUARDA EN localStorage)
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
        }
    });

    function openHTML(files, htmlFile) {
        const newWindow = window.open();
        const fileURLs = {};

        // Crear URLs temporales para cada archivo
        for (let filename in files) {
            fileURLs[filename] = URL.createObjectURL(files[filename]);
        }

        // Leer y modificar el HTML antes de abrirlo
        const reader = new FileReader();
        reader.readAsText(files[htmlFile]);
        reader.onload = function () {
            let htmlContent = reader.result;

            // Modificar rutas en el HTML para CSS, JS, imágenes y otros recursos
            htmlContent = htmlContent.replace(/(href|src)="([^"]+)"/g, (match, attr, path) => {
                if (fileURLs[path]) {
                    return `${attr}="${fileURLs[path]}"`;
                }
                return match;
            });

            // Escribir el HTML modificado en la nueva ventana
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        };
    }
});

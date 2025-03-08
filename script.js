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

            // Crear nueva ventana y document
            const newWindow = window.open();
            const newDoc = newWindow.document;
            newDoc.open();
            newDoc.write('<!DOCTYPE html><html><head></head><body></body></html>');
            newDoc.close();

            // Extraer el contenido del HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Reemplazar rutas en el HTML con URLs temporales
            tempDiv.querySelectorAll('link[rel="stylesheet"], script, img, video, audio, source').forEach(element => {
                let attr = element.tagName === 'LINK' ? 'href' : 'src';
                let path = element.getAttribute(attr);
                if (fileURLs[path]) {
                    element.setAttribute(attr, fileURLs[path]);
                }
            });

            // Agregar estilos CSS al <head> de la nueva ventana
            tempDiv.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                let newLink = newDoc.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = link.href;
                newDoc.head.appendChild(newLink);
            });

            // Agregar scripts JS al <body> de la nueva ventana
            tempDiv.querySelectorAll('script').forEach(script => {
                let newScript = newDoc.createElement('script');
                newScript.src = script.src;
                newScript.async = false;
                newDoc.body.appendChild(newScript);
            });

            // Insertar el contenido del HTML en la nueva ventana
            newDoc.body.innerHTML = tempDiv.innerHTML;
        };
    }
});

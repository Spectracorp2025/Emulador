document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const shortcutsContainer = document.getElementById('shortcutsContainer');

    // Cargar accesos directos desde localStorage al iniciar
    loadShortcuts();

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file && file.name.endsWith('.zip')) {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const htmlFiles = Object.keys(content.files).filter(filename => filename.endsWith('.html'));

            htmlFiles.forEach(async (filename) => {
                const fileData = await content.files[filename].async('string');
                const title = filename.replace('.html', '');

                // Crear acceso directo
                const shortcut = document.createElement('div');
                shortcut.className = 'shortcut';
                shortcut.innerHTML = `
                    <span>${title}</span>
                    <button>Play</button>
                `;

                // Evento para el botón Play
                shortcut.querySelector('button').addEventListener('click', () => {
                    const newWindow = window.open();
                    newWindow.document.write(fileData);
                    newWindow.document.close();
                });

                // Añadir al contenedor y guardar en localStorage
                shortcutsContainer.appendChild(shortcut);
                saveShortcut(title, fileData);
            });
        }
    });

    function saveShortcut(title, data) {
        const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        shortcuts.push({ title, data });
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    }

    function loadShortcuts() {
        const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
        shortcuts.forEach(({ title, data }) => {
            const shortcut = document.createElement('div');
            shortcut.className = 'shortcut';
            shortcut.innerHTML = `
                <span>${title}</span>
                <button>Play</button>
            `;
            shortcut.querySelector('button').addEventListener('click', () => {
                const newWindow = window.open();
                newWindow.document.write(data);
                newWindow.document.close();
            });
            shortcutsContainer.appendChild(shortcut);
        });
    }
});
const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

const imagePath = path.join(__dirname, 'mapa_renderizado.png');

// Pre-carrega a imagem e os metadados em RAM ao iniciar a aplicação
let baseImageBuffer = null;
let width = 0;
let height = 0;

async function initMap() {
    try {
        baseImageBuffer = fs.readFileSync(imagePath);
        const metadata = await sharp(baseImageBuffer).metadata();
        width = metadata.width;
        height = metadata.height;
        console.log(`[Radar] Mapa base carregado em memória (${width}x${height}px)`);
    } catch (err) {
        console.error('[Radar] Erro fatal ao carregar mapa base:', err);
    }
}
initMap();

app.get('/mapa.png', async (req, res) => {
    try {
        if (!baseImageBuffer) {
            return res.status(500).send('Mapa base ainda não carregou');
        }

        const playersParam = req.query.p;
        let circlesSvg = '';

        if (playersParam) {
            const players = String(playersParam).split('-');
            players.forEach(p => {
                const coords = p.split('_').map(Number);
                if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    const px = Math.round(((coords[0] - (-2000)) / 5800) * width);
                    const pz = Math.round(((coords[1] - (-2000)) / 8500) * height);
                    
                    circlesSvg += `
                        <circle cx="${px}" cy="${pz}" r="28" fill="white" stroke="black" stroke-width="4" />
                        <circle cx="${px}" cy="${pz}" r="18" fill="red" />
                    `;
                }
            });
        }

        const svgOverlay = Buffer.from(`
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                ${circlesSvg}
            </svg>
        `);

        // Otimizado com compressionLevel: 1 e effort: 1 para resposta instantânea
        const outputBuffer = await sharp(baseImageBuffer)
            .composite([{ input: svgOverlay, top: 0, left: 0 }])
            .png({ compressionLevel: 1, effort: 1 })
            .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(outputBuffer);

    } catch (err) {
        console.error('Erro ao renderizar:', err);
        res.status(500).send('Erro interno');
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

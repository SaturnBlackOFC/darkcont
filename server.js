const express = require('express');
const sharp = require('sharp');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/mapa.png', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        const playersParam = req.query.p;

        const metadata = await sharp(imagePath).metadata();
        const width = metadata.width;
        const height = metadata.height;

        let circlesSvg = '';

        if (playersParam) {
            // Formato recebido: 2900_5107-X_Z
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

        const outputBuffer = await sharp(imagePath)
            .composite([{ input: svgOverlay, top: 0, left: 0 }])
            .png()
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

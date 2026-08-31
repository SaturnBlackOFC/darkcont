const express = require('express');
const sharp = require('sharp');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        let playersParam = req.query.players;

        const metadata = await sharp(imagePath).metadata();
        const width = metadata.width;
        const height = metadata.height;

        // Limites calibrados para Roma (X: 2930, Z: 5172)
        const minX = -2000, maxX = 3800;
        const minZ = -2000, maxZ = 6500;

        let circlesSvg = '';

        if (playersParam) {
            playersParam = decodeURIComponent(playersParam);
            // Aceita separadores por | ou ;
            const players = playersParam.split(/[;|]/);

            players.forEach(p => {
                const coords = p.split(',').map(Number);
                if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    const x = coords[0];
                    const z = coords[1];

                    const px = Math.round(((x - minX) / (maxX - minX)) * width);
                    const pz = Math.round(((z - minZ) / (maxZ - minZ)) * height);

                    circlesSvg += `
                        <circle cx="${px}" cy="${pz}" r="24" fill="white" stroke="black" stroke-width="4" />
                        <circle cx="${px}" cy="${pz}" r="15" fill="red" />
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
        console.error('Erro ao renderizar mapa:', err);
        res.status(500).send(`Erro interno: ${err.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

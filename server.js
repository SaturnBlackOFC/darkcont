const express = require('express');
const sharp = require('sharp');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        const playersParam = req.query.players;

        // Se não houver parâmetro de jogadores, entrega a imagem limpa imediatamente
        if (!playersParam) {
            return res.sendFile(imagePath);
        }

        const metadata = await sharp(imagePath).metadata();
        const width = metadata.width;
        const height = metadata.height;

        // Limites de coordenadas do mundo no Minecraft
        const minX = -3712, maxX = 3712;
        const minZ = -4032, maxZ = 8064;

        const players = decodeURIComponent(playersParam).split(/[;|]/);
        let circlesSvg = '';

        players.forEach(p => {
            const [x, z] = p.split(',').map(Number);
            if (!isNaN(x) && !isNaN(z)) {
                // Cálculo de posição relativa na imagem
                const px = ((x - minX) / (maxX - minX)) * width;
                const pz = ((z - minZ) / (maxZ - minZ)) * height;

                // Desenha a marcação usando vetor SVG ultra-rápido
                circlesSvg += `
                    <circle cx="${px}" cy="${pz}" r="22" fill="white" stroke="black" stroke-width="4" />
                    <circle cx="${px}" cy="${pz}" r="14" fill="red" />
                `;
            }
        });

        // Cria a camada transparente com as bolinhas
        const svgOverlay = Buffer.from(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                ${circlesSvg}
            </svg>
        `);

        // Funde a camada SVG sobre o mapa de forma instantânea
        const outputBuffer = await sharp(imagePath)
            .composite([{ input: svgOverlay, top: 0, left: 0 }])
            .png()
            .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(outputBuffer);

    } catch (err) {
        console.error('Erro ao renderizar mapa:', err);
        res.status(500).send(`Erro: ${err.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

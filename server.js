const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// O nome do arquivo no GitHub precisa ser EXATAMENTE igual a este (respeitando maiúsculas/minúsculas)
const imagePath = path.join(__dirname, 'mapa_renderizado.png');

app.get('/mapa.png', async (req, res) => {
    // Configura cabeçalhos para o Discord não guardar cache
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const playersParam = req.query.p;

    // 1. SE NÃO HOUVER JOGADORES: Entrega a imagem limpa diretamente do disco em 5ms
    if (!playersParam) {
        if (!fs.existsSync(imagePath)) {
            console.error('[ERRO] O arquivo mapa_renderizado.png não existe no diretório do servidor!');
            return res.status(404).send('Imagem nao encontrada no servidor');
        }
        return res.sendFile(imagePath);
    }

    // 2. SE HOUVER JOGADORES: Processa o mapa com os pontos
    try {
        const metadata = await sharp(imagePath).metadata();
        const width = metadata.width;
        const height = metadata.height;

        let circlesSvg = '';
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

        const svgOverlay = Buffer.from(`
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                ${circlesSvg}
            </svg>
        `);

        const outputBuffer = await sharp(imagePath)
            .composite([{ input: svgOverlay, top: 0, left: 0 }])
            .png({ compressionLevel: 1, effort: 1 })
            .toBuffer();

        return res.send(outputBuffer);

    } catch (err) {
        console.error('Erro ao processar imagem:', err);
        return res.status(500).send('Erro interno ao renderizar');
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

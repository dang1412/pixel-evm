import { PlayerState } from '../types'

const bgImgSrc = '/bomb/bomb-share-bg.png'
export function createShareImage(players: PlayerState[], round: number, onImageReady: (dataUrl: string) => void) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const width = 1200
  const height = 630
  canvas.width = width
  canvas.height = height

  const bgImg = new Image()
  bgImg.src = bgImgSrc
  bgImg.onload = () => {
    // Draw background
    ctx.drawImage(bgImg, 0, 0, width, height)

    // Add dark overlay for better text contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.fillRect(0, 0, width, height)

    // Draw title
    ctx.fillStyle = '#2C3E50'
    ctx.font = 'bold 56px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`🏆 Bomb Results (Round ${round}) 🏆`, width / 2, 80)

    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

    // Table configuration
    const tableWidth = 700
    const tableX = (width - tableWidth) / 2
    const tableY = 150
    const headerHeight = 60
    const rowHeight = 70
    const tableHeight = headerHeight + rowHeight * sortedPlayers.length
    const padding = 20

    // Column widths
    const rankWidth = 100
    const nameWidth = 350
    const scoreWidth = 250

    // Draw table background with rounded corners
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 15
    ctx.shadowOffsetY = 5
    roundRect(ctx, tableX, tableY, tableWidth, tableHeight, 15)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Draw header background
    ctx.fillStyle = '#3498DB'
    roundRect(ctx, tableX, tableY, tableWidth, headerHeight, 15, true, false)
    ctx.fill()

    // Draw header text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const headerY = tableY + headerHeight / 2
    ctx.fillText('Rank', tableX + rankWidth / 2, headerY)
    ctx.fillText('Player', tableX + rankWidth + nameWidth / 2, headerY)
    ctx.fillText('Score', tableX + rankWidth + nameWidth + scoreWidth / 2, headerY)

    // Draw rows
    sortedPlayers.forEach((player, index) => {
      const rowY = tableY + headerHeight + index * rowHeight

      // Alternate row background
      if (index % 2 === 1) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.08)'
        ctx.fillRect(tableX, rowY, tableWidth, rowHeight)
      }

      // Draw separator line
      if (index > 0) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tableX + padding, rowY)
        ctx.lineTo(tableX + tableWidth - padding, rowY)
        ctx.stroke()
      }

      const textY = rowY + rowHeight / 2

      // Rank with medal for top 3
      ctx.textAlign = 'center'
      ctx.font = 'bold 32px Arial'
      if (index === 0) {
        ctx.fillStyle = '#FFD700' // Gold
        ctx.fillText('🥇', tableX + rankWidth / 2, textY)
      } else if (index === 1) {
        ctx.fillStyle = '#C0C0C0' // Silver
        ctx.fillText('🥈', tableX + rankWidth / 2, textY)
      } else if (index === 2) {
        ctx.fillStyle = '#CD7F32' // Bronze
        ctx.fillText('🥉', tableX + rankWidth / 2, textY)
      } else {
        ctx.fillStyle = '#7F8C8D'
        ctx.font = 'bold 28px Arial'
        ctx.fillText(`#${index + 1}`, tableX + rankWidth / 2, textY)
      }

      // Player name
      ctx.fillStyle = '#2C3E50'
      ctx.font = 'bold 26px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(player.name, tableX + rankWidth + nameWidth / 2, textY)

      // Score
      ctx.fillStyle = '#27AE60'
      ctx.font = 'bold 32px Arial'
      ctx.fillText(player.score.toString(), tableX + rankWidth + nameWidth + scoreWidth / 2, textY)
    })

    onImageReady(canvas.toDataURL())
  }
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  topOnly = false,
  bottomOnly = false
) {
  ctx.beginPath()
  if (topOnly) {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.arcTo(x + width, y, x + width, y + radius, radius)
    ctx.lineTo(x + width, y + height)
    ctx.lineTo(x, y + height)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
  } else if (bottomOnly) {
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.lineTo(x + width, y + height - radius)
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    ctx.lineTo(x + radius, y + height)
    ctx.arcTo(x, y + height, x, y + height - radius, radius)
    ctx.lineTo(x, y)
  } else {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.arcTo(x + width, y, x + width, y + radius, radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    ctx.lineTo(x + radius, y + height)
    ctx.arcTo(x, y + height, x, y + height - radius, radius)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
  }
  ctx.closePath()
}

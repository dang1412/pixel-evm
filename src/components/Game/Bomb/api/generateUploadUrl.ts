// const apiUrl = 'http://localhost:8080'
const apiUrl = 'https://api.pixelonbase.com'

export async function generateUploadUrl(fileName: string, fileType: string): Promise<string> {
  const response = await fetch(`${apiUrl}/generateUploadURL`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileType }),
  })

  const data = await response.json()
  if (data.success) {
    return data.uploadURL
  } else {
    throw new Error('Failed to generate upload URL')
  }
}

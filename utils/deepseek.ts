export async function simpleChat(prompt: string, url: string, key: string) {
  // const url = process.env.DEEPSEEK_API_URL ?? ''
  // const key = process.env.DEEPSEEK_API_KEY ?? ''
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      thinking: {
        type: ''
      }
    }),
  })
}

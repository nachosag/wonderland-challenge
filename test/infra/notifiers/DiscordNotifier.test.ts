import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DiscordNotifier } from '../../../src/infra/notifiers/DiscordNotifier'

describe('DiscordNotifier', () => {
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/fake/url'
  const JOB_ADDRESS = '0xe717ec34b2707fc8c226b34be5eae8482d06ed03'
  const TX_HASH = '0xf11d5c073028cda6907167b7bf22a6f9e24756ef'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('debería hacer POST al webhook con el payload correcto', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    const notifier = new DiscordNotifier(WEBHOOK_URL)
    await notifier.notify(JOB_ADDRESS, TX_HASH)

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(WEBHOOK_URL, expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
  })

  it('debería incluir jobAddress y txHash en el body del embed', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    const notifier = new DiscordNotifier(WEBHOOK_URL)
    await notifier.notify(JOB_ADDRESS, TX_HASH)

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse((callArgs[1] as RequestInit).body as string)

    expect(body.embeds[0].fields).toContainEqual(
      expect.objectContaining({ value: JOB_ADDRESS })
    )
    expect(body.embeds[0].fields).toContainEqual(
      expect.objectContaining({ value: TX_HASH })
    )
  })

  it('debería lanzar un error si el webhook responde con status de error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)

    const notifier = new DiscordNotifier(WEBHOOK_URL)

    await expect(notifier.notify(JOB_ADDRESS, TX_HASH))
      .rejects
      .toThrow('[DiscordNotifier] Falló el envío: 401 Unauthorized')
  })
})
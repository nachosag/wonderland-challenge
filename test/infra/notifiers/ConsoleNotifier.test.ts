import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConsoleNotifier } from '../../../src/infra/notifiers/ConsoleNotifier'

describe('ConsoleNotifier', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debería loguear jobAddress y transactionHash por consola', async () => {
    const notifier = new ConsoleNotifier()
    await notifier.notify('0xjob', '0xhash')

    expect(console.log).toHaveBeenCalledOnce()

    const loggedArg = vi.mocked(console.log).mock.calls[0][1]
    expect(loggedArg).toMatchObject({
      jobAddress: '0xjob',
      transactionHash: '0xhash',
    })
  })

  it('debería incluir un timestamp en el log', async () => {
    const notifier = new ConsoleNotifier()
    await notifier.notify('0xjob', '0xhash')

    const loggedArg = vi.mocked(console.log).mock.calls[0][1]
    expect(loggedArg.timestamp).toBeDefined()
    expect(typeof loggedArg.timestamp).toBe('string')
  })
})
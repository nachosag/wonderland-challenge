interface IWorkTransaction {
  readonly to: string | null;
  readonly data: string;
}

interface DetectionResult {
  readonly isMatch: boolean;
  readonly jobAddress?: string;
}

export class WorkDetector {

  public static detect(
    tx: IWorkTransaction,
    jobWhitelist: Set<string>,
    workSelector: string
  ): DetectionResult {
    if (!tx.to) {
      return { isMatch: false }
    }

    const targetAddress = tx.to.toLowerCase()
    const isJob = jobWhitelist.has(targetAddress)
    const isWorkCall = tx.data.startsWith(workSelector)

    if (isJob && isWorkCall) {
      return {
        isMatch: true,
        jobAddress: targetAddress
      }
    }

    return { isMatch: false }
  }
}
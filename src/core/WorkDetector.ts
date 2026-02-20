export interface IWorkTransaction {
  readonly to: string | null;
  readonly data: string;
}

export interface IDetectionResult {
  readonly isMatch: boolean;
  readonly jobAddress?: string;
}

export interface IWorkDetector {
  detect(
    tx: IWorkTransaction,
    jobWhitelist: Set<string>,
    workSelector: string
  ): IDetectionResult;
}

export class WorkDetector implements IWorkDetector {

  public detect(
    tx: IWorkTransaction,
    jobWhitelist: Set<string>,
    workSelector: string
  ): IDetectionResult {
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
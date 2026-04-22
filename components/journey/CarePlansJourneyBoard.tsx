'use client';

import { updateCarePlanStatus } from '@/app/app/actions/care-operations';
import {
  JourneyBoard,
  type JourneyBoardProps,
  type JourneyMoveResult,
} from './JourneyBoard';

export interface CarePlansJourneyBoardProps
  extends Omit<JourneyBoardProps, 'onMove'> {
  orgId: string;
}

export function CarePlansJourneyBoard({
  orgId,
  realtime,
  ...rest
}: CarePlansJourneyBoardProps) {
  async function handleMove(
    itemId: string,
    _from: string,
    toStage: string,
  ): Promise<JourneyMoveResult> {
    const result = await updateCarePlanStatus(itemId, toStage);
    if ('success' in result && result.success) return { success: true };
    const error =
      'error' in result && typeof result.error === 'string'
        ? result.error
        : 'Update failed';
    return { success: false, error };
  }

  return (
    <JourneyBoard
      {...rest}
      onMove={handleMove}
      realtime={
        realtime ?? { table: 'org_care_plans', orgId, orgColumn: 'organization_id' }
      }
    />
  );
}

export default CarePlansJourneyBoard;

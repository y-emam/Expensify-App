import type {FullScreenName} from '@libs/Navigation/types';
import SCREENS from '@src/SCREENS';

const FULL_SCREEN_TO_RHP_MAPPING: Partial<Record<FullScreenName, string[]>> = {
    [SCREENS.WORKSPACE.PROFILE]: [SCREENS.WORKSPACE.NAME, SCREENS.WORKSPACE.CURRENCY, SCREENS.WORKSPACE.DESCRIPTION],
    [SCREENS.WORKSPACE.REIMBURSE]: [SCREENS.WORKSPACE.RATE_AND_UNIT, SCREENS.WORKSPACE.RATE_AND_UNIT_RATE, SCREENS.WORKSPACE.RATE_AND_UNIT_UNIT],
    [SCREENS.WORKSPACE.MEMBERS]: [SCREENS.WORKSPACE.INVITE, SCREENS.WORKSPACE.INVITE_MESSAGE],
    // [SCREENS.WORKSPACE.INITIAL]: [
    //     SCREENS.WORKSPACE.PROFILE,
    //     SCREENS.WORKSPACE.CARD,
    //     SCREENS.WORKSPACE.REIMBURSE,
    //     SCREENS.WORKSPACE.BILLS,
    //     SCREENS.WORKSPACE.INVOICES,
    //     SCREENS.WORKSPACE.TRAVEL,
    //     SCREENS.WORKSPACE.MEMBERS,
    // ],
};

export default FULL_SCREEN_TO_RHP_MAPPING;

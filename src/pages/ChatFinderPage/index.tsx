import isEmpty from 'lodash/isEmpty';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import {useOptionsList} from '@components/OptionListContextProvider';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import UserListItem from '@components/SelectionList/UserListItem';
import useDebouncedState from '@hooks/useDebouncedState';
import useDismissedReferralBanners from '@hooks/useDismissedReferralBanners';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import type {MaybePhraseKey} from '@libs/Localize';
import Navigation from '@libs/Navigation/Navigation';
import type {PlatformStackScreenProps} from '@libs/Navigation/PlatformStackNavigation/types';
import type {RootStackParamList} from '@libs/Navigation/types';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import Performance from '@libs/Performance';
import type {OptionData} from '@libs/ReportUtils';
import * as Report from '@userActions/Report';
import Timing from '@userActions/Timing';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type SCREENS from '@src/SCREENS';
import type * as OnyxTypes from '@src/types/onyx';
import ChatFinderPageFooter from './ChatFinderPageFooter';

type ChatFinderPageOnyxProps = {
    /** Beta features list */
    betas: OnyxEntry<OnyxTypes.Beta[]>;

    /** Whether or not we are searching for reports on the server */
    isSearchingForReports: OnyxEntry<boolean>;
};

type ChatFinderPageProps = ChatFinderPageOnyxProps & PlatformStackScreenProps<RootStackParamList, typeof SCREENS.LEFT_MODAL.CHAT_FINDER>;

type ChatFinderPageSectionItem = {
    data: OptionData[];
    shouldShow: boolean;
};

type ChatFinderPageSectionList = ChatFinderPageSectionItem[];

const setPerformanceTimersEnd = () => {
    Timing.end(CONST.TIMING.CHAT_FINDER_RENDER);
    Performance.markEnd(CONST.TIMING.CHAT_FINDER_RENDER);
};

const ChatFinderPageFooterInstance = <ChatFinderPageFooter />;

function ChatFinderPage({betas, isSearchingForReports, navigation}: ChatFinderPageProps) {
    const [isScreenTransitionEnd, setIsScreenTransitionEnd] = useState(false);
    const {translate} = useLocalize();
    const {isOffline} = useNetwork();
    const {options, areOptionsInitialized} = useOptionsList({
        shouldInitialize: isScreenTransitionEnd,
    });

    const offlineMessage: MaybePhraseKey = isOffline ? [`${translate('common.youAppearToBeOffline')} ${translate('search.resultsAreLimited')}`, {isTranslated: true}] : '';

    const [searchValue, debouncedSearchValue, setSearchValue] = useDebouncedState('');
    const [, debouncedSearchValueInServer, setSearchValueInServer] = useDebouncedState('', 500);
    const updateSearchValue = useCallback(
        (value: string) => {
            setSearchValue(value);
            setSearchValueInServer(value);
        },
        [setSearchValue, setSearchValueInServer],
    );

    useEffect(() => {
        Timing.start(CONST.TIMING.CHAT_FINDER_RENDER);
        Performance.markStart(CONST.TIMING.CHAT_FINDER_RENDER);
    }, []);

    useEffect(() => {
        Report.searchInServer(debouncedSearchValueInServer.trim());
    }, [debouncedSearchValueInServer]);

    const searchOptions = useMemo(() => {
        if (!areOptionsInitialized || !isScreenTransitionEnd) {
            return {
                recentReports: [],
                personalDetails: [],
                userToInvite: null,
                currentUserOption: null,
                categoryOptions: [],
                tagOptions: [],
                taxRatesOptions: [],
                headerMessage: '',
            };
        }
        const optionList = OptionsListUtils.getSearchOptions(options, '', betas ?? []);
        const header = OptionsListUtils.getHeaderMessage(optionList.recentReports.length + optionList.personalDetails.length !== 0, Boolean(optionList.userToInvite), '');
        return {...optionList, headerMessage: header};
    }, [areOptionsInitialized, betas, isScreenTransitionEnd, options]);

    const filteredOptions = useMemo(() => {
        if (debouncedSearchValue.trim() === '') {
            return {
                recentReports: [],
                personalDetails: [],
                userToInvite: null,
                headerMessage: '',
            };
        }

        const newOptions = OptionsListUtils.filterOptions(searchOptions, debouncedSearchValue, betas);
        const header = OptionsListUtils.getHeaderMessage(newOptions.recentReports.length + Number(!!newOptions.userToInvite) > 0, false, debouncedSearchValue);
        return {
            recentReports: newOptions.recentReports,
            personalDetails: newOptions.personalDetails,
            userToInvite: newOptions.userToInvite,
            headerMessage: header,
        };
    }, [debouncedSearchValue, searchOptions, betas]);

    const {recentReports, personalDetails: localPersonalDetails, userToInvite, headerMessage} = debouncedSearchValue.trim() !== '' ? filteredOptions : searchOptions;

    const sections = useMemo((): ChatFinderPageSectionList => {
        const newSections: ChatFinderPageSectionList = [];

        if (recentReports?.length > 0) {
            newSections.push({
                data: recentReports.map((report) => ({...report, isBold: report.isUnread})),
                shouldShow: true,
            });
        }

        if (localPersonalDetails.length > 0) {
            newSections.push({
                data: localPersonalDetails,
                shouldShow: true,
            });
        }

        if (!isEmpty(userToInvite)) {
            newSections.push({
                data: [userToInvite],
                shouldShow: true,
            });
        }

        return newSections;
    }, [localPersonalDetails, recentReports, userToInvite]);

    const selectReport = (option: OptionData) => {
        if (!option) {
            return;
        }

        if (option.reportID) {
            updateSearchValue('');
            Navigation.dismissModal(option.reportID);
        } else {
            Report.navigateToAndOpenReport(option.login ? [option.login] : []);
        }
    };

    const handleScreenTransitionEnd = () => {
        setIsScreenTransitionEnd(true);
    };

    const {isDismissed} = useDismissedReferralBanners({referralContentType: CONST.REFERRAL_PROGRAM.CONTENT_TYPES.REFER_FRIEND});

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            testID={ChatFinderPage.displayName}
            onEntryTransitionEnd={handleScreenTransitionEnd}
            shouldEnableMaxHeight
            navigation={navigation}
        >
            <HeaderWithBackButton
                title={translate('common.find')}
                onBackButtonPress={Navigation.goBack}
            />
            <SelectionList<OptionData>
                sections={areOptionsInitialized ? sections : CONST.EMPTY_ARRAY}
                ListItem={UserListItem}
                textInputValue={searchValue}
                textInputLabel={translate('selectionList.nameEmailOrPhoneNumber')}
                textInputHint={offlineMessage}
                onChangeText={updateSearchValue}
                headerMessage={headerMessage}
                onLayout={setPerformanceTimersEnd}
                onSelectRow={selectReport}
                showLoadingPlaceholder={!areOptionsInitialized || !isScreenTransitionEnd}
                footerContent={!isDismissed && ChatFinderPageFooterInstance}
                isLoadingNewOptions={!!isSearchingForReports}
            />
        </ScreenWrapper>
    );
}

ChatFinderPage.displayName = 'ChatFinderPage';

export default withOnyx<ChatFinderPageProps, ChatFinderPageOnyxProps>({
    betas: {
        key: ONYXKEYS.BETAS,
    },
    isSearchingForReports: {
        key: ONYXKEYS.IS_SEARCHING_FOR_REPORTS,
        initWithStoredValues: false,
    },
})(ChatFinderPage);

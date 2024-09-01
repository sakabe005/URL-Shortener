describe('tab groupの機能', () => {
    let tabGroupSelectMock;
    let localStorageMock;
    let chromeTabGroupsQueryMock;
    let addEventListenerSpy;

    beforeEach(() => {
        // addEventListener のスパイを設定
        addEventListenerSpy = jest.spyOn(document, 'addEventListener');

        // DOM要素のモック
        document.body.innerHTML = '<select id="tabGroupSelect"></select>';
        tabGroupSelectMock = document.getElementById('tabGroupSelect');

        // localStorage のモック
        localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Chrome API のモック
        global.chrome = {
            tabGroups: {
                query: jest.fn()
            }
        };
        chromeTabGroupsQueryMock = chrome.tabGroups.query;

        // テスト対象スクリプトのロード
        jest.isolateModules(() => {
            require('../../UrlShortner/popup/popup_tab_groups');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('DOMContentLoaded イベントリスナーが正しく設定されているか確認', () => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    test('タブグループの読み込みと選択肢の生成が正しく行われるか確認', (done) => {
        const mockGroups = [
            { id: '1', title: 'Group 1' },
            { id: '2', title: 'Group 2' }
        ];

        chromeTabGroupsQueryMock.mockImplementation((query, callback) => {
            callback(mockGroups);
        });

        localStorageMock.getItem.mockReturnValue('1');

        // DOMContentLoaded イベントをトリガー
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // 非同期処理を待つ
        setTimeout(() => {
            expect(tabGroupSelectMock.children.length).toBe(3); // デフォルトオプション + 2グループ
            expect(tabGroupSelectMock.value).toBe('1');
            done();
        }, 0);
    });

    test('タブグループ選択時にlocalStorageに保存されるか確認', (done) => {
        const mockGroups = [
            { id: '1', title: 'Group 1' },
            { id: '2', title: 'Group 2' }
        ];

        chromeTabGroupsQueryMock.mockImplementation((query, callback) => {
            callback(mockGroups);
        });

        // DOMContentLoaded イベントをトリガー
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // 非同期処理を待つ
        setTimeout(() => {
            // change イベントをシミュレート
            tabGroupSelectMock.value = '2';
            tabGroupSelectMock.dispatchEvent(new Event('change'));

            expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedTabGroupId', '2');
            done();
        }, 0);
    });
});
describe('設定アイコンの機能', () => {
    let addEventListenerSpy;
    let getElementByIdSpy;
    let chromeTabsCreateSpy;
    let chromeRuntimeGetURLSpy;

    beforeEach(() => {
        // DOM モック設定
        document.body.innerHTML = '<div id="settingIcon"></div>';

        // スパイ設定
        addEventListenerSpy = jest.spyOn(document, 'addEventListener');
        getElementByIdSpy = jest.spyOn(document, 'getElementById');

        // Chrome API モック設定
        global.chrome = {
            runtime: {
                getURL: jest.fn().mockReturnValue('../settings/index.html')
            },
            tabs: {
                create: jest.fn()
            }
        };
        chromeTabsCreateSpy = jest.spyOn(chrome.tabs, 'create');
        chromeRuntimeGetURLSpy = jest.spyOn(chrome.runtime, 'getURL');

        // テスト対象スクリプトのロード
        jest.isolateModules(() => {
            require('../../UrlShortner/popup/popup');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('DOMContentLoadedイベントリスナーが正しく設定されているか確認', () => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    test('設定アイコンのクリックハンドラーが正しく設定されているか確認', () => {
        // DOMContentLoadedイベントのトリガー
        document.dispatchEvent(new Event('DOMContentLoaded'));

        expect(getElementByIdSpy).toHaveBeenCalledWith('settingIcon');
        expect(document.getElementById('settingIcon').onclick).toBeDefined();
    });

    test('設定アイコンクリック時に新しいタブが開くか確認', () => {
        // DOMContentLoadedイベントのトリガー
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const settingIcon = document.getElementById('settingIcon');
        settingIcon.click();

        expect(chromeRuntimeGetURLSpy).toHaveBeenCalledWith('../settings/index.html');
        expect(chromeTabsCreateSpy).toHaveBeenCalledWith({ url: '../settings/index.html' });
    });
});
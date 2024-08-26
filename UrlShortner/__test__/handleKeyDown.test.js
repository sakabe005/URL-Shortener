import { handleKeyDown } from '../popup/popup_focus';

describe('handleKeyDown', () => {
  let event;
  let makeButton;
  let goButton;

  beforeEach(() => {
    makeButton = document.createElement('button');
    makeButton.id = 'make';
    makeButton.click = jest.fn(); // 偽のmakeButton
    document.body.appendChild(makeButton);

    goButton = document.createElement('button');
    goButton.id = 'go';
    goButton.click = jest.fn(); // 偽のgoButton
    document.body.appendChild(goButton);

    event = {
      isComposing: false,
      key: '',
      preventDefault: jest.fn(),
      ctrlKey: false,
      metaKey: false,
    };
  });

  afterEach(() => {
    document.body.removeChild(makeButton);
    document.body.removeChild(goButton);
  });

 
  test('Enterとctrlが同時に押されたら偽のmakeButtonを押す', () => {
    event.key = 'Enter';
    event.ctrlKey = true;
    handleKeyDown(event);
    expect(makeButton.click).toHaveBeenCalled();
  });

  test('Enterが押されたら偽のgoButtonを押す', () => {
    event.key = 'Enter';
    handleKeyDown(event);
    expect(goButton.click).toHaveBeenCalled();
  });
});



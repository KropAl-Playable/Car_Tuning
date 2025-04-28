import { _decorator, Component, Node, Button, Label, Sprite } from 'cc';
import { CarController, TuningCategory, WheelOptions, ColorOptions, EngineOptions } from './CarController';
const { ccclass, property } = _decorator;

interface TuningOption {
    name: string;
    price: number;
    value: WheelOptions | ColorOptions | EngineOptions;
}

@ccclass('TuningUIController')
export class TuningUIController extends Component {
    
    // region Properties
    @property(CarController) carController: CarController;
    @property(Node) mainButtons: Node;
    @property(Node) colorOptionsPanel: Node;
    @property(Node) engineOptionsPanel: Node;
    @property(Node) wheelsOptionsPanel: Node;
    @property(Button) doneButton: Button;
    @property(Label) budgetLabel: Label;

    private currentBudget = 150000;
    private currentCategory: TuningCategory | null = null;
    private selectedOption: any = null;
    private tunedParts: number = 0;

    // Цены на тюнинг
    private tuningPrices = {
        [TuningCategory.COLOR]: {
            [ColorOptions.RED]: 10000,
            [ColorOptions.ORANGE]: 10000,
            [ColorOptions.MATTE_BLACK]: 10000
        },
        [TuningCategory.WHEELS]: {
            [WheelOptions.BASIC]: 5000,
            [WheelOptions.STREET]: 15000,
            [WheelOptions.SPORT]: 25000
        },
        [TuningCategory.ENGINE]: {
            [EngineOptions.BASIC]: 10000,
            [EngineOptions.STREET]: 20000,
            [EngineOptions.SPORT]: 35000
        }
    };
    // endregion
    start() {
        this.updateBudgetDisplay();
        this.initializeButtons();
    }

    private initializeButtons() {
        //--- color buttons ---//
        this.colorOptionsPanel.getChildByName('option#1').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'ORANGE', price: 10000, value: ColorOptions.ORANGE})
        })
        this.colorOptionsPanel.getChildByName('option#2').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'RED', price: 10000, value: ColorOptions.RED})
        })
        this.colorOptionsPanel.getChildByName('option#3').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'BLACK', price: 10000, value: ColorOptions.MATTE_BLACK})
        })

        //--- engine buttons ---//
        this.engineOptionsPanel.getChildByName('option#1').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'BASIC', price: 0, value: EngineOptions.BASIC})
        })
        this.engineOptionsPanel.getChildByName('option#2').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'STREET', price: 20000, value: EngineOptions.STREET})
        })
        this.engineOptionsPanel.getChildByName('option#3').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'SPORT', price: 35000, value: EngineOptions.SPORT})
        })

        //--- wheels buttons ---//
        this.wheelsOptionsPanel.getChildByName('option#1').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'BASIC', price: 0, value: WheelOptions.BASIC})
        })
        this.wheelsOptionsPanel.getChildByName('option#2').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'STREET', price: 15000, value: WheelOptions.STREET})
        })
        this.wheelsOptionsPanel.getChildByName('option#3').on(Button.EventType.CLICK, ()=>{
            this.selectOption({name:'SPORT', price: 25000, value: WheelOptions.SPORT})
        })
    }

    // region Button Methods

    public showColorOptions() {
        if (this.currentCategory !== TuningCategory.COLOR) {
            this.cancelPreview();
        }
        this.currentCategory = TuningCategory.COLOR;
        this.colorOptionsPanel.active = true;
        this.engineOptionsPanel.active = false;
        this.wheelsOptionsPanel.active = false;
        this.doneButton.node.active = false;
    }

    public showEngingeOptions() {
        if (this.currentCategory !== TuningCategory.ENGINE) {
            this.cancelPreview();
        }
        this.currentCategory = TuningCategory.ENGINE;
        this.colorOptionsPanel.active = false;
        this.engineOptionsPanel.active = true;
        this.wheelsOptionsPanel.active = false;
        this.doneButton.node.active = false;
    }

    public showWheelsOptions() {
        if (this.currentCategory !== TuningCategory.WHEELS) {
            this.cancelPreview();
        }
        this.currentCategory = TuningCategory.WHEELS;
        this.colorOptionsPanel.active = false;
        this.engineOptionsPanel.active = false;
        this.wheelsOptionsPanel.active = true;
        this.doneButton.node.active = false;
    }

    // Выбор конкретной опции (превью)
    public selectOption(option: TuningOption) {
        this.selectedOption = option;
        this.carController.previewTuning(this.currentCategory!, option.value);
        this.doneButton.node.active = true;
    }

    // Подтверждение выбора
    public confirmSelection() {
        if (!this.selectedOption || !this.currentCategory) return;

        const price = this.tuningPrices[this.currentCategory][this.selectedOption.value];
        if (this.currentBudget >= price) {
            this.currentBudget -= price;
            this.carController.confirmPreview();
            this.updateBudgetDisplay();
            this.checkTunedParts();

            if (this.currentCategory === TuningCategory.WHEELS) {
                const wheelButton = this.mainButtons.getChildByName('Wheels')
                wheelButton.getComponent(Button).interactable = false;
                wheelButton.getComponent(Sprite).grayscale = true;
            }

            if (this.currentCategory === TuningCategory.COLOR) {
                const colorButton = this.mainButtons.getChildByName('Color')
                colorButton.getComponent(Button).interactable = false;
                colorButton.getComponent(Sprite).grayscale = true;
            }

            if (this.currentCategory === TuningCategory.ENGINE) {
                const engineButton = this.mainButtons.getChildByName('Engine')
                engineButton.getComponent(Button).interactable = false;
                engineButton.getComponent(Sprite).grayscale = true;
            }
        } else {
            console.log("Not enough money!");
            this.carController.cancelPreview();
        }

        this.backToMainMenu();
    }

    // Отмена превью
    public cancelPreview() {
        this.carController.cancelPreview();
        this.backToMainMenu();
    }

    private backToMainMenu() {
        this.currentCategory = null;
        this.selectedOption = null;
        this.colorOptionsPanel.active = false;
        this.engineOptionsPanel.active = false;
        this.wheelsOptionsPanel.active = false;
        this.doneButton.node.active = false;
    }

    // endregion

    // region Utility Methods
    private updateBudgetDisplay() {
        this.budgetLabel.string = `${this.currentBudget.toLocaleString()}`;
    }

    private checkTunedParts() {
        this.tunedParts++
        if (this.tunedParts >= 3) {
            // logic to start a ride
            console.log("let's ride!")
        }
    }

    // endregion
}
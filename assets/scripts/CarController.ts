import { BoxCollider, Color, CylinderCollider, MeshRenderer, PointToPointConstraint, tween } from 'cc';
import { _decorator, Component, input, Input, Material, Node, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// region Enums

export enum TuningCategory {
    WHEELS = 'WHEELS',
    COLOR = 'COLOR',
    ENGINE = 'ENGINE'
}

export enum WheelOptions {
    STOCK = 'STOCK',
    BASIC = 'BASIC',
    STREET = 'STREET',
    SPORT = 'SPORT'
}

export enum ColorOptions {
    STOCK = '#FFFFFF',
    RED = '#940000',
    ORANGE = '#D66F00',
    MATTE_BLACK = '#1F1F1F'
}

export enum EngineOptions {
    STOCK = 'STOCK',
    BASIC = 'BASIC',
    STREET = 'STREET',  
    SPORT = 'SPORT'
}

// endregion

interface CarTuning {
    wheels: WheelOptions;
    color: ColorOptions;
    engine: EngineOptions;
}

@ccclass('CarController')
export class CarController extends Component {

    @property(RigidBody) car_rb: RigidBody;
    @property(Material) body_paint: Material;
    @property([Node]) wheels: Node[] = [];
    @property([Node]) body_parts: Node[] = [];
    
    private _canMove: boolean = false;

    // Базовые физические параметры (в СИ-подобных единицах)
    private _physicsStats = {
        maxSpeed: 60,           // m/s
        acceleration: 8,        // m/s2
        power: 8000,            // N
        mass: 1200,             // kg
        dragCoefficient: 0.3    // linear damping
    };

    private _currentTuning: CarTuning = {
        wheels: WheelOptions.STOCK,
        color: ColorOptions.STOCK,
        engine: EngineOptions.STOCK
    };

    // Текущие модифицированные параметры
    private _currentPhysics = {...this._physicsStats};

    // region Lifecycle
    protected start(): void {
        this._updateColor(ColorOptions.STOCK);
        input.on(Input.EventType.TOUCH_END, this.debugMethod, this);
    }
    
    protected update(dt: number): void {
        if (!this._canMove) this.car_rb.setLinearVelocity(Vec3.ZERO);
    }

    private debugMethod() {
        //this.shakeCar()
    }

    // endregion

    // region CarTuning
    private _previewTuning: CarTuning | null = null;
    private lastPreviewCategory: TuningCategory | null = null;

    public previewTuning(category: TuningCategory, option: WheelOptions | ColorOptions | EngineOptions) {
        if (!this._previewTuning) {
            this._previewTuning = {...this._currentTuning};
        }
        this.lastPreviewCategory = category; // Запоминаем категорию
        
        // Применяем изменения только для текущей категории
        switch (category) {
            case TuningCategory.WHEELS:
                this._updateWheels(option as WheelOptions, true);
                break;
            case TuningCategory.COLOR:
                this._updateColor(option as ColorOptions, true);
                break;
            case TuningCategory.ENGINE:
                this._updateEngine(option as EngineOptions, true);
                break;
        }
    }
    
    public cancelPreview() {
        if (!this._previewTuning || !this.lastPreviewCategory) return;
        
        // Откатываем только последнюю изменённую категорию
        switch (this.lastPreviewCategory) {
            case TuningCategory.WHEELS:
                this._updateWheels(this._previewTuning.wheels);
                break;
            case TuningCategory.COLOR:
                this._updateColor(this._previewTuning.color);
                break;
            case TuningCategory.ENGINE:
                this._updateEngine(this._previewTuning.engine);
                break;
        }
        
        this._previewTuning = null;
        this.lastPreviewCategory = null;
    }

    /**
     * Подтверждает изменения из превью
     */
    public confirmPreview() {
        if (this._previewTuning) {
            // Фиксируем изменения
            this._currentTuning = {...this._previewTuning};
            this._previewTuning = null;
        }
    }

    private _updateWheels(option: WheelOptions, isPreview = false) {
        const targetOption = isPreview ? option : (this._currentTuning.wheels = option);
        
        switch (targetOption) {
            case WheelOptions.STOCK:
                this._currentPhysics.acceleration = this._physicsStats.acceleration;
                this._currentPhysics.dragCoefficient = this._physicsStats.dragCoefficient;
                this.tweenWheels('basic_wheel');
                break;
            case WheelOptions.BASIC:
                this._currentPhysics.acceleration = this._physicsStats.acceleration *= 1.05;
                this._currentPhysics.dragCoefficient = 0.27;
                this.tweenWheels('wheel_paragon');
                this.shakeCar();
                break;
            case WheelOptions.STREET:
                this._currentPhysics.acceleration *= 1.1;
                this._currentPhysics.dragCoefficient = 0.25;
                this.tweenWheels('wheel_touge6');
                this.shakeCar();
                break;
            case WheelOptions.SPORT:
                this._currentPhysics.acceleration *= 1.15;
                this._currentPhysics.dragCoefficient = 0.15;
                this.tweenWheels('wheels_blade');
                this.shakeCar();
                break;
        }
    }

    private _updateColor(option: ColorOptions, isPreview = false) {
        const targetOption = isPreview ? option : (this._currentTuning.color = option);

        const hex = targetOption;
        const color = new Color(
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        );
        this.setColor(color);
    }

    private _updateEngine(option: EngineOptions, isPreview = false) {
        const targetOption = isPreview ? option : (this._currentTuning.engine = option);

        switch (targetOption) {
            case EngineOptions.STOCK:
                this._currentPhysics.maxSpeed = this._physicsStats.maxSpeed;
                this._currentPhysics.power = this._physicsStats.power;
                break;
            case EngineOptions.BASIC:
                this._currentPhysics.maxSpeed *= 1.1;
                this._currentPhysics.power *= 1.2;
                this.shakeCar();
                break;
            case EngineOptions.STREET:
                this._currentPhysics.maxSpeed *= 1.15;
                this._currentPhysics.power *= 1.3;
                this.shakeCar();
                break;
            case EngineOptions.SPORT:
                this._currentPhysics.maxSpeed *= 1.25;
                this._currentPhysics.power *= 1.4;
                this.shakeCar();
                break;
        }
    }

    private setColor(color: Color) {
        const body_mats: Material[] = [];

        this.body_paint.setProperty('albedo', color, 0);

    }
    // endregion

    // region Movement Methods
    // Применяет силу для движения вперёд
    private _applyEngineForce() {
        // Рассчитываем силу на основе мощности и массы
        const forceMagnitude = this._currentPhysics.power * this._currentPhysics.acceleration;
        const forceDir = this.node.forward; // Направление "вперёд" машины
        
        this.car_rb.applyImpulse(forceDir.multiplyScalar(forceMagnitude));
    }

    // Ограничение скорости по физике
    private _limitVelocity() {
        const currentVel = new Vec3();

        this.car_rb.getLinearVelocity(currentVel)
        if (currentVel.length() > this._currentPhysics.maxSpeed) {
            currentVel.normalize().multiplyScalar(this._currentPhysics.maxSpeed);
            this.car_rb.setLinearVelocity(currentVel);
        }
    }

    // endregion

    // region Utility Methods

    findMaterialByName(meshRenderer: MeshRenderer, name: string): Material | null {
        const materials = meshRenderer.materials;
        for (let i = 0; i < materials.length; i++) {
            if (materials[i].name === name) {
                return materials[i];
            }
        }
        return null;
    }

    private activatePhysics() {
        if (this._canMove) {
            if (this.car_rb) {
                this.car_rb.enabled = true;
                this.car_rb.node.getComponent(BoxCollider).enabled = true;
            }

            this.wheels.forEach((wheel)=>{
                const rb = wheel.getComponent(RigidBody);
                const cyl = wheel.getComponent(CylinderCollider);
                const hinge = wheel.getComponent(PointToPointConstraint);

                if (rb && cyl && hinge) {
                    rb.enabled = true;
                    cyl.enabled = true;
                    hinge.enabled = true;
                }
            })
        }
    }

    // Конвертирует физические параметры в "игровые" значения
    public getDisplayStats() {
        return {
            // м/с -> км/ч
            speed: Math.round(this._currentPhysics.maxSpeed * 3.6),
            // м/с² -> время разгона 0-100 км/ч
            acceleration: (100 / (3.6 * this._currentPhysics.acceleration)).toFixed(1) + 's',
            // Условные единицы -> "лошадиные силы"
            horsePower: Math.round(this._currentPhysics.power / 10)
        };
    }

    // Анимация покачивания авто после применения тюнинга
    private shakeCar() {
        const car_node = this.car_rb.node;

        const shakeCount = 3;
        const duration: number = 0.10;
        const tiltAngle: number = 1;
        const fadeFactor: number = 0.7;

        let currentTween = tween(car_node);

        for (let i = 0; i < shakeCount; i++) {
            const angle = tiltAngle * Math.pow(fadeFactor, i);
            currentTween = currentTween
                .to(duration, { eulerAngles: new Vec3(0, 0, -angle) }, { easing: 'sineInOut' })
                .to(duration, { eulerAngles: new Vec3(0, 0, angle) }, { easing: 'sineInOut' });
        }

        currentTween.to(duration, { eulerAngles: Vec3.ZERO }, { easing: 'quadOut' })
            .start();
    }

    private tweenWheels(child: string) {
        this.wheels.forEach((wheel) => {
            wheel.children.forEach(child => child.active = false)

            const target = wheel.getChildByName(child);
            target.active = true;
            let xOffset = .5;

            if (wheel.position.x < 0) xOffset = -.5;

            target.setPosition(new Vec3(xOffset, 0, 0))
            const currentRotX = target.eulerAngles.x;
            const targetRotY = target.eulerAngles.y;
            
            tween(target)
                .delay(Math.random()*.1)
                .to(.5, { position: new Vec3(0, 0, 0), eulerAngles: new Vec3(currentRotX + 360, targetRotY, 0) }, { easing: 'backOut' })
                .start()
        })
    }

    public getCurrentTuning(): CarTuning {
        return {...this._currentTuning};
    }
    
    public getPreviewTuning(): CarTuning | null {
        return this._previewTuning ? {...this._previewTuning} : null;
    }

    // endregion
    
}



import IMaybeError from "../../Core.Interfaces/return-types/IMaybeError";
import MaybeError from "../../Core.Interfaces/return-types/MaybeError";
import ICanApplySerializable from "../../Core.Interfaces/seralization/ICanApplySerializable";
import IProducesSerializable from "../../Core.Interfaces/seralization/IProducesSerializable";
import CodecError from "../../Core.Serialization/CodecError";

export default class WrapperComponent<T, TSerializable = never> implements ICanApplySerializable<TSerializable>, IProducesSerializable<TSerializable> {
    private _value: T;

    get value() {
        return this._value;
    }

    constructor(value: T) {
        this._value = value;
    }

    produceSerializable(): TSerializable {
        const valueAsSerializable = this._value as IProducesSerializable<TSerializable>;
        if(valueAsSerializable.produceSerializable) {
            return valueAsSerializable.produceSerializable();
        }

        return {} as TSerializable;
    }

    applySerializable(serialized: TSerializable): IMaybeError<void> {
        const valueAsSerializable = this._value as ICanApplySerializable<TSerializable>;
        if(valueAsSerializable.applySerializable) {
            return valueAsSerializable.applySerializable(serialized);
        }

        return MaybeError.fromError(new CodecError("applySerializable not implemented for wrapped component"));
    }
}

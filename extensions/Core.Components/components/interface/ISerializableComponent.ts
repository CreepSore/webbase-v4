import ICanApplySerializable from "../../../Core.Interfaces/seralization/ICanApplySerializable";
import IProducesSerializable from "../../../Core.Interfaces/seralization/IProducesSerializable";

export default interface ISerializableComponent<TSerializable> extends IProducesSerializable<TSerializable>, ICanApplySerializable<TSerializable> {

}

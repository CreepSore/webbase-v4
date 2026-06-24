import ValidationResult from "./ValidationResult";
import ValidationError from "./ValidationResult";

export default interface IValidatable {
    isValid(): ValidationResult;
}

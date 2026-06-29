declare module "snarkjs" {
  export const groth16: {
    fullProve(
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<{ proof: object; publicSignals: string[] }>;
    prove(
      zkeyFileName: string,
      witnessFileName: string
    ): Promise<{ proof: object; publicSignals: string[] }>;
    verify(
      verificationKey: object,
      publicSignals: string[],
      proof: object
    ): Promise<boolean>;
    exportSolidityCallData(proof: object, publicSignals: string[]): Promise<string>;
  };
}

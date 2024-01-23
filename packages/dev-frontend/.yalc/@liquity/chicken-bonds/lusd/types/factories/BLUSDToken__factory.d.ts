import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BLUSDToken, BLUSDTokenInterface } from "../BLUSDToken";
declare type BLUSDTokenConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class BLUSDToken__factory extends ContractFactory {
    constructor(...args: BLUSDTokenConstructorParams);
    deploy(name_: string, symbol_: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<BLUSDToken>;
    getDeployTransaction(name_: string, symbol_: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): BLUSDToken;
    connect(signer: Signer): BLUSDToken__factory;
    static readonly bytecode = "0x60806040523480156200001157600080fd5b506040516200121938038062001219833981016040819052620000349162000193565b818160036200004483826200028c565b5060046200005382826200028c565b505050620000706200006a6200007860201b60201c565b6200007c565b505062000358565b3390565b600580546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b634e487b7160e01b600052604160045260246000fd5b600082601f830112620000f657600080fd5b81516001600160401b0380821115620001135762000113620000ce565b604051601f8301601f19908116603f011681019082821181831017156200013e576200013e620000ce565b816040528381526020925086838588010111156200015b57600080fd5b600091505b838210156200017f578582018301518183018401529082019062000160565b600093810190920192909252949350505050565b60008060408385031215620001a757600080fd5b82516001600160401b0380821115620001bf57600080fd5b620001cd86838701620000e4565b93506020850151915080821115620001e457600080fd5b50620001f385828601620000e4565b9150509250929050565b600181811c908216806200021257607f821691505b6020821081036200023357634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200028757600081815260208120601f850160051c81016020861015620002625750805b601f850160051c820191505b8181101562000283578281556001016200026e565b5050505b505050565b81516001600160401b03811115620002a857620002a8620000ce565b620002c081620002b98454620001fd565b8462000239565b602080601f831160018114620002f85760008415620002df5750858301515b600019600386901b1c1916600185901b17855562000283565b600085815260208120601f198616915b82811015620003295788860151825594840194600190910190840162000308565b5085821015620003485787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b610eb180620003686000396000f3fe608060405234801561001057600080fd5b50600436106101165760003560e01c806381d3c435116100a2578063a457c2d711610071578063a457c2d71461023c578063a9059cbb1461024f578063c6315aa014610262578063dd62ed3e14610275578063f2fde38b146102ae57600080fd5b806381d3c435146101e95780638da5cb5b146101fc57806395d89b41146102215780639dc29fac1461022957600080fd5b8063313ce567116100e9578063313ce56714610181578063395093511461019057806340c10f19146101a357806370a08231146101b8578063715018a6146101e157600080fd5b806306fdde031461011b578063095ea7b31461013957806318160ddd1461015c57806323b872dd1461016e575b600080fd5b6101236102c1565b6040516101309190610ce0565b60405180910390f35b61014c610147366004610d4a565b610353565b6040519015158152602001610130565b6002545b604051908152602001610130565b61014c61017c366004610d74565b61036d565b60405160128152602001610130565b61014c61019e366004610d4a565b610391565b6101b66101b1366004610d4a565b6103d0565b005b6101606101c6366004610db0565b6001600160a01b031660009081526020819052604090205490565b6101b66103e6565b6101b66101f7366004610db0565b610451565b6005546001600160a01b03165b6040516001600160a01b039091168152602001610130565b6101236104de565b6101b6610237366004610d4a565b6104ed565b61014c61024a366004610d4a565b6104ff565b61014c61025d366004610d4a565b610591565b600654610209906001600160a01b031681565b610160610283366004610dd2565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6101b66102bc366004610db0565b61059f565b6060600380546102d090610e05565b80601f01602080910402602001604051908101604052809291908181526020018280546102fc90610e05565b80156103495780601f1061031e57610100808354040283529160200191610349565b820191906000526020600020905b81548152906001019060200180831161032c57829003601f168201915b5050505050905090565b600033610361818585610667565b60019150505b92915050565b60003361037b85828561078c565b61038685858561081e565b506001949350505050565b3360008181526001602090815260408083206001600160a01b038716845290915281205490919061036190829086906103cb908790610e55565b610667565b6103d86109ec565b6103e28282610a5c565b5050565b6005546001600160a01b031633146104455760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064015b60405180910390fd5b61044f6000610b3b565b565b6005546001600160a01b031633146104ab5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161043c565b6006805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383161790556104db6103e6565b50565b6060600480546102d090610e05565b6104f56109ec565b6103e28282610b9a565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156105845760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b606482015260840161043c565b6103868286868403610667565b60003361036181858561081e565b6005546001600160a01b031633146105f95760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161043c565b6001600160a01b03811661065e5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b606482015260840161043c565b6104db81610b3b565b6001600160a01b0383166106c95760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161043c565b6001600160a01b03821661072a5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161043c565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198114610818578181101561080b5760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161043c565b6108188484848403610667565b50505050565b6001600160a01b0383166108825760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b606482015260840161043c565b6001600160a01b0382166108e45760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b606482015260840161043c565b6001600160a01b0383166000908152602081905260409020548181101561095c5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b606482015260840161043c565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610993908490610e55565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516109df91815260200190565b60405180910390a3610818565b6006546001600160a01b0316331461044f5760405162461bcd60e51b815260206004820152602d60248201527f424c555344546f6b656e3a2043616c6c6572206d75737420626520436869636b60448201526c32b72137b73226b0b730b3b2b960991b606482015260840161043c565b6001600160a01b038216610ab25760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640161043c565b8060026000828254610ac49190610e55565b90915550506001600160a01b03821660009081526020819052604081208054839290610af1908490610e55565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b600580546001600160a01b0383811673ffffffffffffffffffffffffffffffffffffffff19831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b038216610bfa5760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b606482015260840161043c565b6001600160a01b03821660009081526020819052604090205481811015610c6e5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b606482015260840161043c565b6001600160a01b0383166000908152602081905260408120838303905560028054849290610c9d908490610e68565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200161077f565b600060208083528351808285015260005b81811015610d0d57858101830151858201604001528201610cf1565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b0381168114610d4557600080fd5b919050565b60008060408385031215610d5d57600080fd5b610d6683610d2e565b946020939093013593505050565b600080600060608486031215610d8957600080fd5b610d9284610d2e565b9250610da060208501610d2e565b9150604084013590509250925092565b600060208284031215610dc257600080fd5b610dcb82610d2e565b9392505050565b60008060408385031215610de557600080fd5b610dee83610d2e565b9150610dfc60208401610d2e565b90509250929050565b600181811c90821680610e1957607f821691505b602082108103610e3957634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8082018082111561036757610367610e3f565b8181038181111561036757610367610e3f56fea26469706673582212207700ae617f7132a5b2bf9529fa7381704d0b8b1aafd1e84bc977a106cd6f9a6464736f6c63430008100033";
    static readonly abi: ({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
        name?: undefined;
        outputs?: undefined;
    } | {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        stateMutability?: undefined;
        outputs?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): BLUSDTokenInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): BLUSDToken;
}
export {};

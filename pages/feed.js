import Head from 'next/head'
import Link from 'next/link'
import Header from "../components/Header.js"
import CommitCardListDummy from "../components/CommitCardListDummy.js"
import CommitCardList from "../components/CommitCardList.js"
import { Placeholders } from "../components/Placeholders.js"
import { useState, useEffect } from 'react'
import { useAccount, useContractRead } from 'wagmi'
import abi from "../contracts/CommitManager.json"

export default function Feed() {

  useEffect(() => {
    buildCommitArray()
    setLoadingState('loaded')
  }, []);

  // state
  const [loadingState, setLoadingState] = useState('loading')
  const [commitArray, setCommitArray] = useState([])
  const { address: isConnected } = useAccount()

  // smart contract
  const contractAddress = "0x013e7A0632389b825Ce45581566EeE5108eB8e5a"
  const { data: commitData, isError, isLoading: commitIsLoading } = useContractRead({
    addressOrName: contractAddress,
    contractInterface: abi.abi,
    functionName: "getAllCommits",
  })

  // functions
  function buildCommitArray() {
    if (!commitData) {
      return
    }
    console.log(commitData)
    let newArray = [];
    for (let commit of commitData) {
      let newCommitStruct = {}
      let eTimestamp = commit.expiryTimestamp.toNumber();
      
      let status = "Failure";
      if (commit.commitApproved) {
        status = "Success";
      } else if ( eTimestamp > Date.now()/1000 && commit.proofIpfsHash == "" ) {
        status = "Pending";
      } else if ( eTimestamp > Date.now()/1000 && commit.proofIpfsHash !== "" ) {
        status = "Waiting";
      } 
      
      newCommitStruct.id = commit.id.toNumber();
      newCommitStruct.status = status;
      newCommitStruct.userIsCreator = commit.commitFrom == isConnected;
      newCommitStruct.userIsCommitee = commit.commitTo == isConnected;
      newCommitStruct.expiryTimestamp = eTimestamp;
      newCommitStruct.commitFrom = commit.commitFrom;
      newCommitStruct.commitTo = commit.commitTo;
      newCommitStruct.stakeAmount = commit.stakeAmount;
      newCommitStruct.createdTimestamp = "TODO";
      newCommitStruct.validPeriod = "TODO";
      newCommitStruct.message = commit.message;
      newCommitStruct.ipfsHash = commit.proofIpfsHash;

      newArray.push(newCommitStruct);
    }

    newArray.sort((a, b) => (a.expiryTimestamp > b.expiryTimestamp) ? 1 : -1)
    setCommitArray(newArray);
  }
  
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Just Commit</title>
        <meta property="og:title" content="Just Commit" />
        <meta name="description" content="Just Commit" />
        <meta property="og:description" content="Just Commit" />
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16.ico" />
      </Head>
      
      <Header dropdownLabel = <Link href="./feed">&emsp;&emsp;&emsp;Feed&emsp;&emsp;&emsp;</Link> />
      
      <div className= "w-8/10 sm:w-1/2 mx-auto p-10 mt-20">
        <div className= "flex flex-col justify-center">
          {
            loadingState === 'loading' && <Placeholders loadingStyle = "feedLoadingStyle" number = {6} />
          }
          {
            loadingState === 'loaded' && 
              // <CommitCardListDummy /> // &&
              <CommitCardList cardList = {commitArray} />
          }
        </div>
      </div>
    </>
  )
}


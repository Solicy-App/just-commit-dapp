import Head from 'next/head'
import Header from "../components/Header.js"
import CommitCardList from "../components/CommitCardList.js"
import { Placeholders } from "../components/Placeholders.js"
import { useState, useEffect } from 'react'
import { useAccount, useProvider, useNetwork, useContract } from 'wagmi'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, ABI } from '../contracts/CommitManager.ts';
import PullToRefresh from 'react-simple-pull-to-refresh';

export default function Commitments() {

  // global variables
  const { address: connectedAddress } = useAccount()
  const { chain, chains } = useNetwork()
  const provider = useProvider()

  // state variables
  const [allCommits, setAllCommits] = useState([])

  // getter for all of the contract commits (always listening)
  const getAllCommits = async() => {
    console.log("getAllCommits() call")
    try {
      const { ethereum } = window;
      if (ethereum) {
        const commitManagerContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const commits = await commitManagerContract.getAllCommits();
        if (!commits) {
          return
        }
        // classify each commit
        let commitsClassified = [];
        commits.forEach(commit => {
          commitsClassified.push({
            status: determineStatus(commit),
            id: commit.id.toNumber(),
            commitFrom: commit.commitFrom,
            commitTo: commit.commitTo,
            createdAt: commit.createdAt.toNumber(),
            validThrough: commit.validThrough.toNumber(),
            judgeDeadline: commit.judgeDeadline.toNumber(),
            stakeAmount: commit.stakeAmount,
            message: commit.message,
            ipfsHash: commit.ipfsHash,
            filename: commit.filename,
            commitProved: commit.commitProved,
            commitJudged: commit.commitJudged,
            isApproved: commit.isApproved,           
          });
        });
        setAllCommits(commitsClassified);

        // on each new commit: announce it and change the allCommits state
        // TODO
        //
        //
        //

        // sort according to their creation date
        commitsClassified.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1)
        setAllCommits(commitsClassified)
    
        console.log(commitsClassified);
        
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  // functions
  function determineStatus(commit) {
    let status = "";
    // is valid and does not have a proof
    if (commit.validThrough > Date.now() && !commit.commitProved) {
      status = "Pending";
    }
    // has not expired, has a proof, but has not been judged
    else if (commit.judgeDeadline > Date.now() && commit.commitProved && !commit.commitJudged) {
      status = "Waiting";
    }
    // is approved or the commit expired and was approved
    else if (commit.isApproved || (commit.judgeDeadline < Date.now() && commit.isApproved)) {
      status = "Success";
    }
    // commit has been denied or commit has expired
    else {
      status = "Failure";
    }    
    return status
  }

  /// STATE EFFECTS

  // first page pass
  useEffect(() => {
    getAllCommits()
  }, [])
  
  // render when there's a new commit or account connects
  useEffect(() => {
    <CommitCardList cardList={allCommits} />
  }, [allCommits, connectedAddress])

  return (
    <PullToRefresh onRefresh={() => {
      try {
        return location.reload()
      } catch (error) {
        return
      }
    }}>
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
  
        <Header currentPage = "commitments"/>
  
        <div className="flex h-screen">
          <div className="w-8/10 sm:w-1/2 mx-auto p-0 lg:p-10 mt-20">
            <div className="flex flex-col justify-center items-center">

              <CommitCardList cardList={allCommits} />
              
            </div>
          </div>
        </div>
      </>
    </PullToRefresh>
  );
}

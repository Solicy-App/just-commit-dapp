import Head from 'next/head'
import Header from "../components/Header.js"
import CommitCardList from "../components/CommitCardList.js"
import { Tag } from '@ensdomains/thorin'
import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useAccount, useProvider, useNetwork } from 'wagmi'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, ABI } from '../contracts/CommitManager.ts';

export default function Home() {

  // variables
  const { address: connectedAddress } = useAccount()
  const provider = useProvider()

  // state
  const [allCommits, setAllCommits] = useState([])

  // getter for all of the contract commits (always listening)
  const getAllCommits = async () => {
    // console.log("getAllCommits() call")
    try {
      const { ethereum } = window;
      if (ethereum) {
        const commitPortal = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const commits = await commitPortal.getAllCommits();
        if (!commits) {
          return
        }
        // classify each commit
        let commitsClassified = [];
        commits.forEach(commit => {
          commitsClassified.push({
            // front-end
            status: determineStatus(commit),
            // back-end
            id: commit.id.toNumber(),
            commitFrom: commit.commitFrom,
            commitTo: commit.commitTo,
            commitJudge: commit.commitJudge,
            createdAt: commit.createdAt.toNumber(),
            endsAt: commit.endsAt.toNumber(),
            judgeDeadline: commit.judgeDeadline.toNumber(),
            stakeAmount: commit.stakeAmount,
            filename: commit.filename,
            isCommitProved: commit.isCommitProved,
            isCommitJudged: commit.isCommitJudged,
            isApproved: commit.isApproved,
          });
        });
        setAllCommits(commitsClassified);

        // on each new commit: change the allCommits state
        commitPortal.on("NewCommit", (
          id,
          commitFrom,
          commitTo,
          commitJudge,
          createdAt,
          endsAt,
          judgeDeadline,
          stakeAmount,
          filename,
          isCommitProved,
          isCommitJudged,
          isApproved,
        ) => {
          setAllCommits(prevState => [...prevState, {
            status: "Pending",
            id: id,
            commitFrom: commitFrom,
            commitTo: commitTo,
            commitJudge: commitJudge,
            createdAt: createdAt,
            endsAt: endsAt,
            judgeDeadline: judgeDeadline,
            stakeAmount: stakeAmount,
            filename: filename,
            isCommitProved: isCommitProved,
            isCommitJudged: isCommitJudged,
            isApproved: isApproved,
          }]);
        });

        // sort according to their creation date
        commitsClassified.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1)
        setAllCommits(commitsClassified)

        console.log(commitsClassified)

        // FOR LATER USE (unused events/emits):
        // on a NewProve event
        commitPortal.on("NewProve", (commitId, filename, provedAt) => {
          console.log("New Prove Event:", commitId, filename, provedAt);
        });

        // on a NewJudge event
        commitPortal.on("NewJudge", (commitId, isApproved, judgedAt) => {
          console.log("New Judge Event:", commitId, isApproved, judgedAt);
        });

      } else {
        toast("🚨 ETH wallet not detected.\n\n" +
          "Solutions →\n\n" +
          "1. Download the Metamask extension\t(Desktop)\n\n" +
          "2. Use Metamask or the Brave broswer\t(Mobile)\n",
          { duration: Infinity, id: 'unique', position: 'bottom-center' })
      }
    } catch (error) {
      console.log(error);
    }
  }

  // functions
  function determineStatus(commit) {
    let status = "";
    // is valid and does not have a proof
    if (commit.endsAt > Date.now() && !commit.isCommitProved) {
      status = "Pending";
    }
    // has not expired, has a proof, but has not been judged
    else if (commit.judgeDeadline > Date.now() && commit.isCommitProved && !commit.isCommitJudged) {
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
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Just Commit</title>
        <meta property="og:title" content="Just Commit" />
        <meta name="description" content="Just Commit" />
        <meta property="og:description" content="Just Commit" />
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon.ico" />
      </Head>

      <Header currentPage="home" />

      <div className="flex h-screen">
        <div className="w-8/10 mx-auto p-0 lg:p-10 mt-20">
          <div className="flex flex-col mt-4 justify-center items-center">
            <CommitCardList cardList={allCommits} />
          </div>
        </div>
      </div>

      {/* the commit shortcut floating icon */}
      <div
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          zIndex: "999",
        }}
        className="hover:cursor-pointer"
        onClick={() => {
          window.location.href = "/"
        }}
      >
        <Tag
          style={{
            color: "#1DD297",
            backgroundColor: "#1DD297",
            width: "54px",
            height: "54px",
            fontSize: "1.5rem",
          }}
          className="hover:scale-110 hover:cursor-pointer"
        >
          <img
            style={{ height: "2.5rem" }}
            src="./commit-icon.svg"
            alt="Commit Icon"
          />
        </Tag>
      </div>

      <Toaster />

    </>
  );
}

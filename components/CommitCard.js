import { FileInput, Tag, Button as ButtonThorin } from '@ensdomains/thorin'
import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import Countdown from 'react-countdown';
import { Web3Storage } from 'web3.storage'
import { useAccount, useNetwork, useProvider } from 'wagmi'
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi'
import moment from 'moment/moment';
import Spinner from "../components/Spinner.js";
import { useStorage } from '../hooks/useStorage.ts'
import toast, { Toaster } from 'react-hot-toast'
import { CONTRACT_ADDRESS, ABI } from '../contracts/CommitManager.ts';

// dummy token
const client = new Web3Storage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFiYWYzNkE2NGY2QjI3MDk3ZmQ4ZTkwMTA0NDAyZWNjQ2YxQThCMWEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Njg5OTIxNzYwMzQsIm5hbWUiOiJqdXN0LWNvbW1pdC1kZXYifQ.zZBQ-nVOnOWjK0eZtCexGzpbV7BdO2v80bldS4ecE1E" })

export default function CommitCard({ ...props }) {

  // variables
  const { getItem, setItem, removeItem } = useStorage()
  const CommitStatusEmoji = {
    "Pending": "⚡", // picture not yet submitted
    "Waiting": "⏳", // picture submitted and waiting
    "Failure": "❌", // time expired or picture denied
    "Success": "✅", // picture accepted :) 
  }

  // state
  const [triggerProveContractFunctions, setTriggerProveContractFunctions] = useState(false)
  const [triggerJudgeContractFunctions, setTriggerJudgeContractFunctions] = useState(false)
  const [uploadClicked, setUploadClicked] = useState(false)

  // smart contract data
  const { address } = useAccount()

  // smart contract functions

  // prepare
  const { config: proveCommitConfig } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    functionName: "proveCommit",
    args: [props.id, getItem('ipfsHash', 'session'), getItem('filename', 'session')],
    enabled: triggerProveContractFunctions,
  })
  const { config: judgeCommitConfig } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    functionName: "judgeCommit",
    args: [props.id, getItem('isApproved', 'session')],
    enabled: triggerJudgeContractFunctions,
  })
  
  // write
  const proveWrite = useContractWrite({...proveCommitConfig,
    onSettled() {{ proveWait }},
  })
  const judgeWrite = useContractWrite({...judgeCommitConfig,
    onSettled() {{ judgeWait }},
  })
  
  // wait
  const { wait: proveWait, data: proveWaitData, isLoading: isProveWaitLoading } = useWaitForTransaction({
    hash: proveWrite.data?.hash,
    onSettled() {
      location.reload()
    }
  })
  const { wait: judgeWait, data: judgeWaitData, isLoading: isJudgeWaitLoading } = useWaitForTransaction({
    hash: judgeWrite.data?.hash,
    onSettled() {
      location.reload()
    }
  })

  // functions
  const uploadFile = () => {

    setUploadClicked(true)
    
    const fileInput = document.querySelector('input[type="file"]')
    
    removeItem('filename', "session")
    setItem('filename', fileInput.files[0].name, "session")

    console.log((getItem('filename', 'session').split(".").pop().toUpperCase()))

    if ((getItem('filename', 'session').split(".").pop().toUpperCase()) == "HEIC") {
      console.log("A HEIC image")
    }
    
    if (fileInput.size > 0) {
      client.put(fileInput.files, {
        name: 'fileInput',
        maxRetries: 3,
      }).then(cid => {
        removeItem('ipfsHash', "session")
        setItem('ipfsHash', cid, "session")
        setTriggerProveContractFunctions(true)

        if (!proveWrite.write) {
          setUploadClicked(false)
          toast("🔁 Refresh and upload again (bug)", {duration: 4000})
          return
        }
        proveWrite.write?.()
      })
    }
  }

  return (
    <>
      <div style={{ borderRadius: "12px" }} className={classNames({
        'styledBorder': true,
        'styledBorder--waiting': props.status == "Waiting",
        'styledBorder--success': props.status == "Success",
        'styledBorder--failure': props.status == "Failure",
        'styledBorder--pending': props.status == "Pending",

      })}>
        <div className="flex flex-col bg-white p-2.5" style={{ borderRadius: "12px" }}>
          <div className="flex flex-row" style={{ justifyContent: "space-between" }}>
            <div className="w-4/5 text-sm block">{props.message}</div>
            <div className="flex align-left space-x-2">
              <div className="text-sm text-slate-400 opacity-80" style={{ whiteSpace: "nowrap" }}>
                {
                  // active
                  (props.status == "Pending") ?
                    <Countdown date={props.validThrough} daysInHours></Countdown> :
                    // waiting or verify
                    (props.status == "Waiting") ?
                      moment(props.judgeDeadline).fromNow(true) + " left":
                      // my history or feed
                      moment(props.createdAt * 1000).fromNow()
                }
              </div>
            </div>
          </div>
          <div className={classNames({
            'pictureArea': true,
            'pictureArea--waiting': props.status == "Waiting",
            'pictureArea--success': props.status == "Success",
            'pictureArea--failure': props.status == "Failure" && !props.commitProved,
            'pictureArea--pending': props.status == "Pending",
          })}>
            {/* CARD BODY */}

            {/* card is active */}
            {props.status == "Pending" &&
              <>
                <div className="flex flex-col" style={{ alignItems: "center" }}>
                  <div className="flex">
                     <FileInput maxSize={20} onChange={(file) => uploadFile()}>
                      {(context) =>
                        (uploadClicked || isProveWaitLoading || proveWrite.isLoading) ?
                          <div className="justifyCenter">
                            <Spinner />
                            <div className="heartbeat">don't refresh :)</div>
                          </div>
                          :
                          (context.name && triggerProveContractFunctions) ?
                          <div>
                            <a
                              className="text-4xl hover:cursor-pointer"
                              href="#"
                              onClick={(e) => { 
                                e.preventDefault();
                                location.reload(); 
                              }}
                            >
                              &nbsp;🔁&nbsp;
                          </a>
                          </div>
                          :
                          <div>
                            <Tag
                              className="text-2xl hover:cursor-pointer"
                              tone="accent"
                              variation="primary"
                              size="large"
                            >
                              &nbsp;📷&nbsp;
                            </Tag>
                          </div>
                      }
                    </FileInput>
                  </div>
                </div>
              </>
            }

            {/*
            ---------
            DEBUGGING
            ---------
            */}

            {/*
            isProveWaitLoading: {String(isProveWaitLoading)}
            <br></br>
            <br></br>
            */}
            
            {/*
            validThrough: {validThrough}
            <br></br>
            <br></br>
            Date.now(): {Date.now()}
            */}

            {/* show the image if there's an image to show */}
            {(props.commitProved) &&
              <>
                <div className="flex flex-col" style={{ alignItems: "center" }}>
                  
                  <img 
                    src={`https://${props.ipfsHash}.ipfs.dweb.link/${props.filename}`} 
                    style={{
                      width: "300px",
                      height: "300px",
                      objectFit: "cover",
                      borderRadius: "10px"
                    }} 
                  />
                  
                  {/* "to verify" buttons */}
                  {props.commitTo == address && props.judgeDeadline > Date.now() && !props.commitJudged && (
                    <div>
                      <div className="flex flex-row gap-5 p-5" style={{ justifyContent: "space-between", marginBottom: "-30px" }}>
                        {
                          isJudgeWaitLoading ?
                            <Spinner /> :
                            <>
                              <ButtonThorin
                                tone="red"
                                size="small"
                                variant="secondary"
                                outlined
                                onClick={() => {
                                  removeItem('isApproved', "session")
                                  setItem('isApproved', false, "session")
                                  setTriggerJudgeContractFunctions(true)
                                  // console.log(judgeCommitConfig)
                                  judgeWrite.write?.()
                                }}
                              >
                                Reject
                              </ButtonThorin>
                              <ButtonThorin
                                tone="green"
                                size="small"
                                variant="secondary"
                                outlined
                                onClick={() => {
                                  removeItem('isApproved', "session")
                                  setItem('isApproved', true, "session")
                                  setTriggerJudgeContractFunctions(true)
                                  judgeWrite.write?.()
                                }}
                              >
                                Approve
                              </ButtonThorin>
                            </>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </>
            }
          </div>

          {/* FOOTER */}
          <div className="flex flex-row text-xs pt-2" style={{ justifyContent: "space-between" }}>
            <div className="flex flex-col w-1/2 lg:w-1/3" style={{
              justifyContent: "space-between",
              borderLeft: "2px solid rgba(0, 0, 0, 0.18)",
              borderRight: "2px solid rgba(0, 0, 0, 0.18)",
              borderRadius: "6px",
            }}>
              <div className="flex flex-row" style={{ justifyContent: "space-between" }}>
                <b>&nbsp;From </b>{props.commitFrom.slice(0, 5)}...{props.commitFrom.slice(-4)}&nbsp;
              </div>
              <div className="flex flex-row" style={{ justifyContent: "space-between" }}>
                <b>&nbsp;To </b>justcommit.eth&nbsp;
                {/*<b>&nbsp;To </b>{props.commitTo.slice(0, 5)}...{props.commitTo.slice(-4)}&nbsp;*/}
              </div>
            </div>
           
            <div className="flex flex-row p-1">
              <div className="flex flex-col align-center justify-center">
                <img className="h-6" src="./polygon-logo-tilted.svg" />
              </div>
              <div className="flex flex-col font-semibold align-center justify-center text-l ml-1">{parseFloat(props.stakeAmount)}</div>
            </div>
            
            <div className="flex flex-col align-center justify-center text-lg">
            {
              CommitStatusEmoji[props.status]
            }
            </div>
            <div className="flex flex-col w-1/10 font-medium align-center justify-center text-blue-600
              text-xs rounded-lg bg-sky-200 hover:bg-sky-400 hover:cursor-pointer">
              <a onClick={() => { toast("⏳ Working on it...") }}>
                {/*}
              <a href={`https://${chain?.id === 5 ? 'goerli.' : ''
                }etherscan.io/tx/${props.txnHash}`} // FIX 
                target="_blank"
                rel="noreferrer"
              >
              */}
                &nbsp;&nbsp;Txn&nbsp;&nbsp;
              </a>
            </div>
          </div>
        </div>

        <Toaster toastOptions={{ duration: 2000 }} />

        {/*
          <br></br>
          {hasProved}
          {props.validThrough}
          <br></br>
          {props.createdAt}
          <br></br>
          {Date.now()}
          <br></br>
          {txnHash}
        */}

      </div>
    </>
  )
}
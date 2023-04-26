import { useState, useEffect, useContext } from 'react'
import Head from 'next/head'
import useFetch from '../hooks/fetch'
import { ethers } from 'ethers'
import { Tag, Heading, FieldSet, Typography, Input, Button as ButtonThorin } from '@ensdomains/thorin'
import toast, { Toaster } from 'react-hot-toast'
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip';
import { useAccount, useNetwork, useProvider, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import Header from '../components/Header.js';
import Spinner from "../components/Spinner.js";
import { Placeholders } from "../components/Placeholders.js";
import LoomModal from "../components/LoomModal.js";
import { CONTRACT_ADDRESS, CONTRACT_OWNER, ABI } from '../contracts/CommitManager.ts';
import { ConnectButton } from '@rainbow-me/rainbowkit'
import PhonePickupsContext from '../services/PhonePickupsContext.js'
// import { PopupButton } from '@typeform/embed-react'

export default function Commit() {

  // first pass
  useEffect(() => {
    getWalletMaticBalance()
    setTimeout(() => {
      setLoadingState("loaded");
    }, 1000);
  }, [])

  // challenge cost
  const CHALLENGE_COST = '10'
  const justCommitServices = CHALLENGE_COST == '100' ? (CHALLENGE_COST * 0.09) : (CHALLENGE_COST * 0.09).toFixed(1);
  const gasCosts = CHALLENGE_COST == '100' ? (CHALLENGE_COST * 0.01) : (CHALLENGE_COST * 0.01).toFixed(1);

  const commitTo = CONTRACT_OWNER
  const commitJudge = CONTRACT_OWNER

  // state
  const [commitAmount, setCommitAmount] = useState(CHALLENGE_COST) // TODO refactor this
  const [loadingState, setLoadingState] = useState('loading')
  const [hasCommitted, setHasCommited] = useState(false)
  const [walletMaticBalance, setWalletMaticBalance] = useState(null)
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  const [videoWatched, setVideoWatched] = useState([false, false, false]);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState(null);
  const [showText, setShowText] = useState(false);
  const [userEmail, setUserEmail] = useState("null@null.com");

  // smart contract data
  const { chain } = useNetwork()
  const { address } = useAccount()
  const provider = useProvider()
  const { phonePickups, setPhonePickups } = useContext(PhonePickupsContext);

  // smart contract functions
  const { config: createCommitConfig } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    functionName: "createCommit",
    args: [commitTo, commitJudge, { value: ((commitAmount == "") ? null : ethers.utils.parseEther(commitAmount)) }],
  })
  const { write: commitWrite, data: commitWriteData, isLoading: isWriteLoading } = useContractWrite({
    ...createCommitConfig,
    onSettled() {
      { wait }
    },
    onError: (err) => {
      const regex = /code=(.*?),/;
      const match = regex.exec(err.message);
      const code = match ? match[1] : null;
      if (code === "ACTION_REJECTED") {
        toast.error("Transaction Rejected")
      }
    }
  })
  const { wait, isLoading: isWaitLoading } = useWaitForTransaction({
    hash: commitWriteData?.hash,
    async onSettled() {
      setHasCommited(true)
      await handleSaveCommitment(userEmail);
    },
  })
  
  const isCommitButtonEnabled = () => {
    return videoWatched.every(v => v) &&
      Boolean(address) &&
      walletMaticBalance > parseFloat(CHALLENGE_COST) &&
      phonePickups > 0;
  };


  // functions
  const handleSaveCommitment = async (email) => {
    try {
      const response = await fetch('/api/save_commitment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, address: address }),
      });
  
      if (!response.ok) {
        console.error('Failed to store commitment in Supabase');
      } else {
        console.log('Commitment saved successfully');
      }
    } catch (error) {
      console.error('Failed to store commitment in Supabase');
    }
  };
  
  function formatCurrency(number, currency = null) {
    const options = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    };

    if (currency) {
      options.style = 'currency';
      options.currency = currency;
    } else {
      options.style = 'decimal';
    }

    return number.toLocaleString('en-US', options);
  }

  async function getWalletMaticBalance() {
    try {
      const balanceMatic = await provider.getBalance(address)
      setWalletMaticBalance(parseFloat((Number(ethers.utils.formatEther(balanceMatic)))))
    } catch (err) {
      console.error("Error getting wallet balance:", err);
      return null;
    }
  }

  // commit logic related
  const closeModal = () => {
    setShowVideoEmbed(false);
  };
  const videoLinks = [
    'https://www.youtube.com/embed/Tx9zMFodNtA',
    'https://www.youtube.com/embed/vqhDkP-Je3E',
    'https://www.youtube.com/embed/e7VveWeRwUU',
    'https://www.youtube.com/embed/SW6L_lTrIFg',
  ];
  const handleWatchVideoClick = (index) => {
    const videoLink = videoLinks[index];

    setShowVideoEmbed(!showVideoEmbed);
    setVideoEmbedUrl(videoLink);

    const newVideoWatched = [...videoWatched];
    newVideoWatched[index] = true;
    setVideoWatched(newVideoWatched);
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  // polygon stats
  const priceApi = useFetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd')
  const maticPrice = parseFloat(priceApi.data?.["matic-network"].usd)

  // effects
  useEffect(() => {
    getWalletMaticBalance()
  }, [address])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // rendering
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

      <Header currentPage="index" />

      <div className="container container--flex h-screen items-stretch">
        <div className="mt-6 mb-0" style={{ padding: "10px" }}>
          <FieldSet
            legend={
              <div className="text-center justify-center align-center">

                <Heading className="mb-4" color="textSecondary" style={{ fontWeight: '700', fontSize: '50px' }}>
                  Welcome!
                </Heading>
                {!showText && (
                  <div className="flex justify-center mt-12">
                    <a
                      data-tooltip-id="my-tooltip"
                      data-tooltip-place="right"
                      onClick={() => {
                        setShowText(true);
                      }}
                    >
                      <Tag
                        style={{ background: '#1DD297' }}
                        size="large"
                        className="hover:scale-125 cursor-pointer"
                      >
                        <b style={{ color: 'white' }}>?</b>
                      </Tag>
                    </a>
                  </div>
                )}
                {showText && (
                  <Typography className="-mb-6" variant="" weight="small" style={{ lineHeight: '1.4em', fontSize: '0.6em' }}>
                    <br />
                    Just Commit is a 1-month challenge designed to
                    <br />
                    help you remove all of the unintentional
                    <br />
                    phone pickups from your day.
                  </Typography>
                )}
                <br />
                <br />
                <Typography
                  className="font-normal -mt-6"
                  style={{
                    lineHeight: '1em',
                    fontSize: '0.6em',
                  }}
                >
                  Get ready to feel more...{' '}
                  <span
                    className=""
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,154,0,1) 10%, rgba(208,222,33,1) 20%, rgba(79,220,74,1) 30%, rgba(63,218,216,1) 40%, rgba(47,201,226,1) 50%, rgba(28,127,238,1) 60%, rgba(95,21,242,1) 70%, rgba(186,12,248,1) 80%, rgba(251,7,217,1) 90%, rgba(255,0,0,1) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontStyle: 'italic',
                      fontWeight: 'bold',
                      fontSize: '2em',
                    }}
                  >
                    &nbsp;ALIVE&nbsp;
                  </span>
                </Typography>
              </div>
            }
          />
        </div>

        {
          loadingState === 'loading' && <Placeholders loadingStyle="indexLoadingStyle" number={1} />
        }

        {
          loadingState === 'loaded' &&

          <form
            id="form"
            className="form"

            // Toast Checks
            onSubmit={async (e) => {
              e.preventDefault()
            }}>

            <div className="flex flex-col w-full gap-6 mt-0" style={{ direction: 'rtl' }}>
              <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.5em' }}>{videoWatched[0] ? '✅' : '→'}</div>
                <div
                  className="permanent-underline hover:scale-105"
                  style={{ fontSize: '1.2em' }}
                  onClick={() => {
                    handleWatchVideoClick(0);
                  }}
                >
                  <Typography style={{ cursor: 'pointer' }}>Why am I here?</Typography>
                </div>
              </div>

              {videoWatched[0] && (
                <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1.5em' }}>{videoWatched[1] ? '✅' : '→'}</div>
                  <div
                    className="permanent-underline hover:scale-105"
                    style={{ fontSize: '1.2em' }}
                    onClick={() => {
                      handleWatchVideoClick(1);
                    }}
                  >
                    <Typography style={{ cursor: 'pointer' }}>What is Just Commit?</Typography>
                  </div>
                </div>

              )}
              {videoWatched[1] && (
                <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1.5em' }}>{videoWatched[2] ? '✅' : '→'}</div>
                  <div
                    className="permanent-underline hover:scale-105"
                    style={{ fontSize: '1.2em' }}
                    onClick={() => {
                      handleWatchVideoClick(2);
                    }}
                  >
                    <Typography style={{ cursor: 'pointer' }}>How does this work?</Typography>
                  </div>
                </div>
              )}

              {videoWatched[2] &&
                <div className="mt-2 mb-2 text-sm" style={{ direction: "ltr" }}>
                  <Input
                    label="Avg # of Phone Pickups Last Week"
                    placeholder="100"
                    min={1}
                    maxLength={3}
                    step={1}
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (!/^\d*$/.test(e.key) && e.key !== 'Backspace') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setPhonePickups((e.target.value))}
                    labelSecondary={
                      <a
                        data-tooltip-id="my-tooltip"
                        data-tooltip-place="right"
                        onClick={() => {
                          handleWatchVideoClick(3)
                        }}
                      >
                        <Tag
                          style={{ background: '#1DD297' }}
                          size="large"
                          className="hover:scale-110 cursor-pointer"
                        >
                          <b style={{ color: 'white' }}>↗</b>
                        </Tag>
                      </a>
                    }

                    required
                  />
                  <br></br>
                  {phonePickups &&
                    <div className="flex flex-col">
                      <table className="">
                        <thead>
                          <tr>
                            <th className="text-center">Week #</th>
                            <th className="text-center">Pickup Goal</th>
                            <th className="text-center">At Stake</th>
                          </tr>
                        </thead>
                        <br></br>
                        <tbody style={{ lineHeight: '25px' }}>
                          <tr>
                            <td className="text-center">1</td>
                            <td className="text-center">
                              {phonePickups === null
                                ? <span>? <span className="text-xs"><b>(↓10%)</b></span></span>
                                : <><span>{"< " + Math.floor(phonePickups * 0.9)}</span> <span className="text-xs"><b>(↓10%)</b></span></>
                              }
                            </td>
                            <td className="flex flex-row justify-center items-center">
                              <div className="flex flex-col">
                                <img className="h-4" src="./polygon-logo-tilted.svg" />
                              </div>
                              &nbsp;{Math.floor(commitAmount * 0.1)}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-center">2</td>
                            <td className="text-center">
                              {phonePickups === null
                                ? <span>? <span className="text-xs justify-end"><b>(↓20%)</b></span></span>
                                : <><span>{"< " + Math.floor(phonePickups * 0.9 * 0.8)}</span> <span className="text-xs"><b>(↓20%)</b></span></>
                              }
                            </td>
                            <td className="flex flex-row justify-center items-center">
                              <div className="flex flex-col">
                                <img className="h-4" src="./polygon-logo-tilted.svg" />
                              </div>
                              &nbsp;{Math.floor(commitAmount * 0.2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-center">3</td>
                            <td className="text-center">
                              {phonePickups === null
                                ? <span>? <span className="text-xs justify-end"><b>(↓20%)</b></span></span>
                                : <><span>{"< " + Math.floor(phonePickups * 0.9 * 0.8 * 0.8)}</span> <span className="text-xs"><b>(↓20%)</b></span></>
                              }
                            </td>
                            <td className="flex flex-row justify-center items-center">
                              <div className="flex flex-col">
                                <img className="h-4" src="./polygon-logo-tilted.svg" />
                              </div>
                              &nbsp;{Math.floor(commitAmount * 0.2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-center">4</td>
                            <td className="text-center">
                              {phonePickups === null
                                ? <span>? <span className="text-xs justify-end"><b>(↓40%)</b></span></span>
                                : <><span>{"< " + Math.floor(phonePickups * 0.9 * 0.8 * 0.8 * 0.6)}</span> <span className="text-xs"><b>(↓40%)</b></span></>
                              }
                            </td>
                            <td className="flex flex-row justify-center items-center">
                              <div className="flex flex-col">
                                <img className="h-4" src="./polygon-logo-tilted.svg" />
                              </div>
                              &nbsp;{Math.floor(commitAmount * 0.4)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }

              {showVideoEmbed && (
                <LoomModal closeModal={closeModal} videoEmbedUrl={videoEmbedUrl} />
              )}
              {/* <Checkbox
                label={
                  <PopupButton
                    id="IfnJtCQO"
                    onSubmit={() => {
                      setTypeformCompleted(true);
                    }}
                  >
                    <button className="permanent-underline">
                      Fill Out The Form
                    </button>
                  </PopupButton>
                }
                checked={typeformCompleted}
                onClick={() => toast.error("Complete the Typeform")}
              /> */}

              {phonePickups &&
                <div>
                  <br />
                  <br />
                  <div className="flex items-center gap-3 justify-center -mt-4 mb-5 hover:cursor-pointer" style={{ direction: "ltr" }}>
                    <a
                      data-tooltip-id="my-tooltip"
                      data-tooltip-place="top"
                      data-tooltip-content={`+ JC Services Rendered: ${justCommitServices} MATIC`}
                    >
                      <Tag
                        style={{ background: '#1DD297' }}
                        size="large"
                      >
                        <b style={{ color: 'white' }}>⚡</b>
                      </Tag>
                    </a>
                    <a
                      data-tooltip-id="my-tooltip"
                      data-tooltip-place="top"
                      data-tooltip-content={`+ Gas Fees (Sent Back To You): ${gasCosts} MATIC`}
                    >
                      <Tag
                        style={{ background: '#1DD297' }}
                        size="large"
                      >
                        <b style={{ color: 'white' }}>⛽</b>
                      </Tag>
                    </a>
                  </div>
                  <div
                    className="flex justify-center"
                    style={{ direction: 'ltr' }}
                  >
                    <div
                      className="flex justify-center"
                      style={{ direction: 'ltr', color: '#3B3B3B', fontSize: '16px', fontWeight: 'bold' }}>
                      {"(1 MATIC = "}
                      {formatCurrency(!priceApi.isLoading && formatCurrency(maticPrice, "USD"))})
                    </div>
                  </div>
                  <br />
                  <div
                    className="flex justify-center cursor-pointer"
                    style={{ direction: 'ltr' }}
                  >
                    <ConnectButton className="" showBalance={true} accountStatus="none" />
                  </div>
                  <br />
                  <br />
                </div>
              }
            </div>

            {/* Commit Button */}
           {(!((isWriteLoading || isWaitLoading)) && !hasCommitted) &&
            isCommitButtonEnabled() && (
              <>
                <div className="flex justify-center text-sm hover:cursor-pointer" style={{ direction: "ltr" }}>
                  <Input
                    label="Your Email (Optional)"
                    placeholder="daniel@belfort.com"
                    // error={ userEmail && !userEmail.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) ? ' ' : '' }
                    onChange={(e) => setUserEmail(e.target.value)}
                    labelSecondary={
                      <a
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content="🔔 To get weekly submission reminders"
                        data-tooltip-place="top"
                      >
                        <Tag className="" style={{ background: "#1DD297" }} size="large">
                          <b style={{ color: "white" }}>?</b>
                        </Tag>
                      </a>
                    }
                  />
                </div>
              
                <ButtonThorin
                  style={{
                    width: "90%",
                    height: "2.8rem",
                    marginTop: "2rem",
                    marginBottom: "0rem",
                    backgroundColor: isCommitButtonEnabled() ? "rgb(29 210 151)" : "rgb(29 210 151 / 36%)",
                    borderRadius: 12,
                    color: "white",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  size="small"
                  shadowless
                  type="submit"
                  suffix={"(" + commitAmount + " MATIC) "}
                  // suffix= {"(" + formatCurrency(100, "USD") + ")"} // {!priceApi.isLoading && "(" + formatCurrency(maticPrice * commitAmount, "USD") + ")"}
                  disabled={!isCommitButtonEnabled()}
                  onClick={commitWrite}
                >
                  Commit
                </ButtonThorin>
              </>
            )}

            <Toaster toastOptions={{ duration: 2000 }} />
            <Tooltip id="my-tooltip"
              style={{ backgroundColor: "#1DD297", color: "#ffffff", fontWeight: 500 }}
            />

            {(((isWriteLoading || isWaitLoading)) && !hasCommitted) && (
              <div className="justifyCenter">
                <Spinner />
              </div>
            )}

            {hasCommitted &&
              <div className="w-full relative">
                <div className="absolute w-full p-1" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div className="flex justify-center w-3/10 mt-4">
                    <ButtonThorin
                      className="flex"
                      style={{ padding: "20px", backgroundColor: "#1DD297", boxShadow: "0px 2px 2px 1px rgb(0 0 0 / 80%)", borderRadius: "10px" }}
                      outlined
                      shape="rounded"
                      size="small"
                      variant="primary"
                      as="a"
                      href="./home"
                      onClick={() => {
                        localStorage.setItem("selectedFilter", "Active");
                      }}
                    >
                      View Commitment
                    </ButtonThorin>
                  </div>
                </div>
                <div className="flex justify-end w-full">
                  <div className="flex" style={{ width: "52px" }}>
                    <ButtonThorin
                      className="flex align-center mt-6 mb-5 sm:mb-0 justify-center rounded-lg hover:cursor-pointer"
                      style={{ background: "#bae6fd", zIndex: 2, fontSize: "1.2rem", padding: "5px" }}
                      as="a"
                      href={`https://${chain?.id === 80001 ? 'mumbai.' : ''
                        }polygonscan.com/tx/${commitWriteData.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🔎
                    </ButtonThorin>
                  </div>
                </div>
              </div>
            }

            {/*
            ---------
            DEBUGGING
            ---------
            */}

            {/*
            <br></br>
            block.timestamp * 1000: {Math.floor(Date.now() / 1000) * 1000}
            <br></br>*/}

            {/* userEmail: {userEmail} */}

            {/* commitAmount: {commitAmount}
            <br></br>
            commitJudge: {commitJudge}
            <br></br>
            commitTo: {commitTo} */}

            {/* <br></br>
            <br></br>
            maticPrice * commitAmount: {typeof(maticPrice * commitAmount)}
            <br></br>
            <br></br>
            isWaitLoading: {String(isWaitLoading)}
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            Date.now(): {Date.now()} */}

          </form>
        }
      </div>
    </>
  )
}

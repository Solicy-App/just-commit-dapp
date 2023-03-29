import Head from 'next/head'
import useFetch from '../hooks/fetch'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Tag, Input, Heading, FieldSet, RadioButton, RadioButtonGroup, Select, Typography, Button as ButtonThorin } from '@ensdomains/thorin'
import toast, { Toaster } from 'react-hot-toast'
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip';
import { useAccount, useNetwork, useProvider, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import Header from '../components/Header.js';
import Spinner from "../components/Spinner.js";
import { Placeholders } from "../components/Placeholders.js";
import { CONTRACT_ADDRESS, CONTRACT_OWNER, ABI } from '../contracts/CommitManager.ts';

export default function Commit() {

  // first pass
  useEffect(() => {
    getWalletMaticBalance()
    setTimeout(() => {
      setLoadingState("loaded");
    }, 1000);
  }, [])

  // hard-coded
  const PurplePropHouseMultiSig = "0x3e2cd6ca1f18d27fe1bbeb986914e98d5dd08bb0"

  // state
  const [commitDescription, setCommitDescription] = useState('')
  const [commitTo, setCommitTo] = useState(PurplePropHouseMultiSig)
  const [commitJudge, setCommitJudge] = useState([CONTRACT_OWNER])
  const [commitAmount, setCommitAmount] = useState('0')
  const [startsAt, setStartsAt] = useState(Date.now()) // startsAt is pre-set to 12h after commiting
  const [endsAt, setEndsAt] = useState((24 * 3600 * 1000) + Date.now()) // duration is pre-set to 24h
  const [loadingState, setLoadingState] = useState('loading')
  const [hasCommitted, setHasCommited] = useState(false)
  const [walletMaticBalance, setWalletMaticBalance] = useState(null)
  const [betModality, setBetModality] = useState("solo")

  // smart contract data
  const { chain, chains } = useNetwork()
  const { address } = useAccount()
  const provider = useProvider()

  // smart contract functions
  const { config: createCommitConfig } = usePrepareContractWrite({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    functionName: "createCommit",
    args: [commitDescription, commitTo, commitJudge, startsAt, endsAt, betModality == "solo",
      { value: ((commitAmount == "") ? null : ethers.utils.parseEther(commitAmount)) }],
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
    onSettled() {
      setHasCommited(true)
    },
  })

  // functions
  function formatCurrency(number, currency = null) {
    const options = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
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

  // polygon stats
  const priceApi = useFetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd')
  const maticPrice = parseFloat(priceApi.data?.["matic-network"].usd)

  // effects
  useEffect(() => {
    getWalletMaticBalance()
  }, [address])

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
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16.ico" />
      </Head>

      <Header currentPage="commit" />

      <div className="container container--flex h-screen">
        <div className="mt-5 sm:mt-3" style={{ padding: "10px" }}>
          <FieldSet
            legend={<Heading color="textSecondary" style={{ fontWeight: "700", fontSize: "40px" }}>Bet On Yourself</Heading>}
          >
            <RadioButtonGroup
              className="items-start place-self-center"
              onChange={(e) => setBetModality(e.target.value)}
            >
              <div className="flex gap-4">
                <RadioButton
                  checked={true}
                  id="solo"
                  label="Solo"
                  name="solo"
                  value="solo"
                  onClick={() => {
                    setBetModality("solo");
                    setStartsAt(Date.now());
                  }}
                />
                <RadioButton
                  checked={false} // {betModality == "1v1"}
                  id="1v1"
                  label="1v1"
                  name="1v1"
                  value="1v1"
                  onClick={() => {
                    toast('⏳ Coming Soon...', { position: 'top-center', id: 'unique' });
                    setStartsAt(Date.now() + (12 * 3600 * 1000));
                    // DEBUGGING
                    //toast("commitJudge includes address? " + JSON.stringify(commitJudge).toUpperCase().includes(address.toUpperCase()));
                    //toast("address = " + address.toUpperCase())
                  }}
                />
                <RadioButton
                  checked={false} // {betModality == "multiplayer"}
                  id="multiplayer"
                  label="Multiplayer"
                  name="multiplayer"
                  value="multiplayer"
                  onClick={() => {
                    toast('⏳ Coming Soon...', { position: 'top-center', id: 'unique' });
                    setStartsAt(Date.now() + (12 * 3600 * 1000));
                  }}
                />
              </div>
            </RadioButtonGroup>
          </FieldSet>
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
              // is wallet connected?
              if (!address) {
                return toast.error('Connect your wallet')
              }
              // are you on the right network?
              if (!chains.some((c) => c.id === chain.id)) {
                return toast.error('Switch to a supported network')
              }
              // is commitAmount not set?
              if (maticPrice * commitAmount == 0) {
                return toast.error('Set a commitment amount')
              }
              // commiting to self?
              if (JSON.stringify(commitJudge).toUpperCase().includes(address.toUpperCase())) {
                return toast.error('Cannot verify yourself');
              }
            }}>

            <div className="flex flex-col gap-3 w-full">
              <Input
                label="I Want To"
                maxLength={140}
                placeholder=""
                disabled={!isWriteLoading && !isWaitLoading && hasCommitted}
                labelSecondary={
                  <a
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="📸 Can you prove it?"
                    data-tooltip-place="right"
                  >
                    <Tag
                      style={{ background: '#21AD85' }}
                      tone="green"
                      size="large"
                    >
                      <b style={{ color: 'white' }}>?</b>
                    </Tag>
                  </a>
                }
                error={
                  commitDescription.match(/^[a-zA-Z0-9\s\.,!?]*$/) || commitDescription.length === 0
                    ? null
                    : 'Alphanumeric Only'
                }
                onChange={(e) => setCommitDescription(e.target.value)}
                required
              />
              <div className="flex flex-row gap-2">
                <div className="w-8/12">
                  <Input
                    label="Or I'll Lose"
                    placeholder="5"
                    disabled={!isWriteLoading && !isWaitLoading && hasCommitted}
                    labelSecondary={
                      <a
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={"1 MATIC 🟰 " + formatCurrency(maticPrice, "USD")}
                        data-tooltip-place="right"
                      >
                        <Tag
                          style={{ background: '#21AD85' }}
                          tone="green"
                          size="large"
                        >
                          <b style={{ color: 'white' }}>?</b>
                        </Tag>
                      </a>
                    }
                    min={0}
                    step="any"
                    max={9999}
                    type="number"
                    error={
                      !address || !walletMaticBalance
                        ? null
                        : commitAmount > walletMaticBalance
                        ? formatCurrency(walletMaticBalance) + " MATIC Available"
                        : commitAmount > 9999
                        ? "Up to 9999"
                        : null
                    }
                    onChange={(e) => {
                      setCommitAmount(e.target.value);
                    }}
                    required
                    prefix={<img className="w-6 h-6 min-w-max object-cover" src="./polygon-logo-tilted.svg" />}
                    suffix=
                    {commitAmount != '0' && (
                      <div className="flex flex-col gap-2" style={{ fontSize: "large" }}>
                        <div className="flex gap-2" style={{ color: 'grey', whiteSpace: 'nowrap' }}>
                          {`(${formatCurrency(maticPrice * commitAmount, "USD")})`}
                        </div>
                      </div>
                    )}
                  />
                </div>
                <div className="w-4/12">
                  <Select
                    value = {PurplePropHouseMultiSig} // default selected
                    style={{background:"rgba(246,246,248)", borderColor:"transparent", borderRadius:"14px"}}
                    label="To"
                    required
                    options={[ // TODO: add descriptive tooltip (Purple Prop House Multisig)
                      { value: PurplePropHouseMultiSig,
                        label: <Typography fontVariant="label" style={{lineHeight:"1.2", fontSize:"small", fontWeight: "550", marginLeft: "-5px"}}>Purple Prop House</Typography>,
                        prefix: <div style={{ width: '16px', height: '16px', background: '#8b62d2' }} />
                      },
                    ]}
                    onChange={(e) => setCommitTo(e.target.value)}
                  />
                </div>
              </div>
              <Input
                label="Expires In"
                placeholder="24"
                disabled={!isWriteLoading && !isWaitLoading && hasCommitted}
                min={1}
                max={24}
                step={1}
                type="number"
                units={((endsAt - Date.now()) / 3600 / 1000) > 1 ? 'hours' : 'hour'}
                error={((endsAt - Date.now()) / 3600 / 1000) > 24 ? "24 hour maximum" : null}
                onChange={(e) => setEndsAt((e.target.value * 3600 * 1000) + Date.now())}
                required
              />
              <Input
                label="Proof Verified By"
                required
                readOnly
                placeholder="justcommit.eth"
                onChange={(e) => setCommitJudge(e.target.value.split(",").map((address) => address.trim()))}
                onClick={() => {
                  toast('⚠️ Disabled (Beta)',
                    { position: 'bottom-center', id: 'unique' }
                  )
                }}
              />
            </div>

            {/* Commit Button */}
            {(!((isWriteLoading || isWaitLoading)) && !hasCommitted) && (
              <ButtonThorin style={{
                width: '60%',
                height: '2.8rem',
                margin: '1rem',
                backgroundColor:
                  commitAmount == 0 || commitAmount == "" ||
                    commitDescription.length < 2 ||
                    commitDescription.length > 35 ||
                    !commitDescription.match(/^[a-zA-Z0-9\s\.,!?]*$/) ||
                    ((endsAt - Date.now()) / 3600 / 1000) > 24 ||
                    commitAmount > 9999 ||
                    commitAmount > walletMaticBalance ?
                    "rgb(30 174 131 / 36%)" : "rgb(30 174 131)",
                borderRadius: 12,
                color: "white",
                transition: "transform 0.2s ease-in-out",
              }}
                size="small"
                shadowless
                type="submit"
                suffix={!priceApi.isLoading && "(" + formatCurrency(maticPrice * commitAmount, "USD") + ")"}
                disabled={
                  commitAmount == 0 || commitAmount == "" ||
                  commitDescription.length < 2 ||
                  commitDescription.length > 35 ||
                  !commitDescription.match(/^[a-zA-Z0-9\s\.,!?]*$/) ||
                  ((endsAt - Date.now()) / 3600 / 1000) > 24 ||
                  commitAmount > 9999 ||
                  commitAmount > walletMaticBalance
                }
                onClick={commitWrite}
              >
                Commit
              </ButtonThorin>
            )}

            <Toaster toastOptions={{ duration: 2000 }} />
            <Tooltip id="my-tooltip"
              style={{ backgroundColor: "#21AD85", color: "#ffffff", fontWeight: 500 }}
            />

            {(((isWriteLoading || isWaitLoading)) && !hasCommitted) && (
              <div className="justifyCenter">
                <Spinner />
              </div>
            )}

            {hasCommitted &&
              <div className="w-full relative">
                <div className="absolute w-full p-5" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div className="flex justify-center w-3/10">
                    <ButtonThorin
                      className="flex"
                      style={{ padding: "20px", boxShadow: "0px 2px 2px 1px rgb(0 0 0 / 80%)", borderRadius: "10px" }}
                      outlined
                      shape="rounded"
                      tone="green"
                      size="small"
                      variant="primary"
                      as="a"
                      href="./"
                      onClick={() => {
                        localStorage.setItem("selectedFilter", "Active");
                      }}
                    >
                      Commitment
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

            {/* address: {address}
            <br></br>
            walletMaticBalance: {walletMaticBalance} */}
            
            {/* <br></br>
            <br></br>
            maticPrice * commitAmount: {typeof(maticPrice * commitAmount)}
            <br></br>
            <br></br>
            isWaitLoading: {String(isWaitLoading)}
            <br></br>
            <br></br>
            endsAt: {endsAt}
            <br></br>
            <br></br>
            Date.now(): {Date.now()} */}

          </form>
        }
      </div>
    </>
  )
}

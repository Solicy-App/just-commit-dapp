import { useEffect, useState } from "react"
import CommitCard from "./CommitCard.js"
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import { Tag } from '@ensdomains/thorin'

export default function CommitCardList({ cardList }) {
  // state
  const [selectedFilter, setSelectedFilter] = useState("Feed")
  const { address: connectedAddress } = useAccount()

  // variables
  const filters_left = ["Feed", "My History"]
  const filters_right = ["Active", "Waiting", "Verify"]
  const cardListToDisplay =
    // Feed: Failure or Success
    selectedFilter == "Feed" ?
      cardList.filter(c => (c.status == "Failure" || c.status == "Success")) :
    // My History: connectedAddress is commitFrom and Failure or Success
    selectedFilter == "My History" ?
      cardList.filter(c => (c.commitFrom == connectedAddress &&
      (c.status == "Failure" || c.status == "Success"))) :
    // Verify: connectedAddress is commitTo and Waiting
    selectedFilter == "Verify" ?
      cardList.filter(c => (c.commitTo == connectedAddress && c.status == "Waiting")) :
    // Waiting: connectedAddress is commitFrom and Waiting
    selectedFilter == "Waiting" ?
      cardList.filter(c => (c.commitFrom == connectedAddress && c.status == "Waiting")) :
    // Active: connectedAddress is commitFrom and Pending
      cardList.filter(c => (c.commitFrom == connectedAddress && c.status == "Pending"))
  
  const filterCounts = [
    { filter: "Verify", count: cardList.filter(c => (c.commitTo == connectedAddress && c.status == "Waiting")).length },
    { filter: "Waiting", count: cardList.filter(c => (c.commitFrom == connectedAddress && c.status == "Waiting")).length },
    { filter: "Active", count: cardList.filter(c => (c.commitFrom == connectedAddress && c.status == "Pending")).length }
  ]
  
  // set Feed filter to active
  useEffect(() => {
    setSelectedFilter("Feed")
    const element = document.getElementById("Feed");
    element.classList.add("active");
  }, [])

  // functions
  const onCategoryClick = (filter) => {
    const oldFilter = selectedFilter
    if (filter != oldFilter) {
      const oldSelected = document.getElementById(oldFilter);
      oldSelected.classList.toggle("active");
      setSelectedFilter(filter);
      const newSelected = document.getElementById(filter);
      newSelected.classList.toggle("active");
    }
  }

  return (
    <>
      <div className="flex justify-center gap-2 lg:gap-16 text-small mt-4 mb-10">
        <ul className="flex flex-row continent_nav">
          {filters_left.map(f =>
            <li key={f} id={f} className="filterOption"
              style={{ borderColor: "rgba(53, 72, 98, 1)", borderWidth: "2px" }}>
              <a onClick={() => onCategoryClick(f)}>{f}</a>
            </li>)}
        </ul>
        <ul className="flex flex-row continent_nav">
          {filters_right.map(f =>
            <li key={f} id={f} className="filterOption"
              style={{ borderColor: "rgba(18, 74, 56, .5)" }}>
              <a onClick={() => onCategoryClick(f)}>{f}</a>
              {filterCounts.find(filterCount => filterCount.filter === f).count > 0 &&
                <Tag
                  className="hover:cursor-pointer"
                  size = "small"
                  style= {{ marginTop:  f == "Verify" ? "-2.85em" : "-2.6em", position: "absolute",
                            marginLeft: f == "Waiting" ? "3.2em" : "2.4em",
                            color: "rgba(255, 255, 255, 1)",
                            backgroundColor: "rgba(255, 80, 80, 1)" }}
                >
                  <b>{filterCounts.find(filterCount => filterCount.filter === f).count}</b>
                </Tag>
              }
            </li>
         )}
        </ul>
      </div>

      <div className="w-full">
        {cardListToDisplay.map((card, index) => (
          <CommitCard
            key={index}
            id={card.id}
            commitFrom={card.commitFrom}
            commitTo={card.commitTo}
            createdAt={card.createdAt}
            validThrough={card.validThrough}
            judgeDeadline={card.judgeDeadline}
            stakeAmount={ethers.utils.formatEther(card.stakeAmount)}
            message={card.message}
            ipfsHash={card.ipfsHash}
            commitProved={card.commitProved}
            commitJudged={card.commitJudged}
            isApproved={card.isApproved}
            status={card.status}
            filename={card.filename}
          />
        )).reverse()}
      </div>
    </>
  )
}

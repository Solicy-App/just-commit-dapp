import { Dropdown } from '@ensdomains/thorin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Header({currentPage}) {

  var dropdownLabel = <img src="./logo.svg" />
  
  return (
    <>
      <div className="header w-full inline-grid justify-between header--absolute bg-white gap-0">
        <div className="flex items-center">
          <Dropdown
            style = {{ padding: "0px", boxShadow: "0px 2px 2px 1px rgb(0 0 0 / 80%)", borderRadius: "10px" }}
            inner
            shortThrow
            chevron = {false}
            label= {dropdownLabel}
            items= {[   
              { label:
                <Link href="/">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  Commitments
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Link>, color: currentPage == "commitments" && "green"},
              { label:
                <Link href="/commit">
                &nbsp;&nbsp;&nbsp;&nbsp;
                  Commit
                &nbsp;&nbsp;&nbsp;&nbsp;
                </Link>, color: currentPage == "commit" && "green" },
              { label: 
                <Link href="http://turf.dev/plots/301"
                      target="_blank" rel="noopener noreferrer">
                &nbsp;&nbsp;
                   Headquarters ↗
                
                
                </Link>, },
              { label: 
                <Link href="https://justcommit.notion.site"
                      target="_blank" rel="noopener noreferrer">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  About ↗
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </Link>, },
            ]}
          />
        </div>
        <div className="flex space-x-0 sm:space-x-10 text-sm sm:text-base items-center gap-10 sm:gap-0">
          <ConnectButton className="hover:shadow-lg" />
        </div>
      </div>
    </>
  )
}
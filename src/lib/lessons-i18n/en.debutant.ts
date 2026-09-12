import type { LessonTranslation } from "./types";

/**
 * English translation of the Débutant level — French source of truth lives in
 * the `lessons` table (curriculum is static, translations live in the repo).
 */
export const EN_DEBUTANT: Record<string, LessonTranslation> = {
  "actions-et-obligations-la-difference": {
    title: "Shares and Bonds: What's the Difference?",
    summary:
      "Tell a share apart from a bond, understand the role of the capital market, and learn the basic vocabulary of the stock exchange.",
    content: `## The great capital market

Before talking about shares or bonds, you need to understand where these trades take place.

The **capital market** is a financial market, which can be physical or virtual. It is where companies, governments and other large institutions come to raise money to finance their long-term projects and activities.

To obtain this money, these entities **issue** (create) securities. As an investor, this is the market where you will be able to buy and sell these famous financial securities, which are designed for medium- or long-term investments.

## What is a "security"?

In financial jargon, a **security** is nothing more than a financial document. This document is legal proof that represents one of these two things:

- either an **ownership right**: you own a piece of the company
- or a **debt**: someone owes you money

The rest of this module follows from this distinction: equity securities on one side, debt securities on the other.

## The equity security: the share

The **share** is the equity security par excellence. Concretely, it represents an ownership stake in a company.

A simple example: if a company is divided into 100 equal parts and you buy 5 shares, you are literally the owner of 5% of that company.

Your goal, as a shareholder, will be to benefit from the growth and future profits of that company.

## The debt security: the bond

Unlike the share, the **debt security** gives you no ownership right at all. It is a financial document that represents a promise to repay a loan on a future date, with interest.

A **bond** is a debt security issued by companies or governments. The mechanism is simple: by buying a bond, you lend money to the issuer.

It is exactly like a classic bank loan, except that instead of a bank granting the loan, it is investors like you who lend the money. In return for this loan, the issuer commits to paying you regular interest payments, called **coupons**.

## The Treasury bill

The **Treasury bill** is a very specific type of bond, issued directly by the government to finance its own spending.

It is therefore individuals, banks or other states that lend money to the government, in exchange for a promise of repayment with interest.

The advantage? Treasury bills are considered very safe investments.

## Going a little further: options

On the market, there are other instruments, such as **options**. These are rather special financial contracts:

- they give the **right** to buy or sell an asset
- but absolutely not the **obligation** to do so
- at a price set in advance, for a future date

For example, during certain operations on the Moroccan market (as with **Akdital** shares), investors can end up with this type of option attached to their investment.

## Don't confuse "subscribing" with "buying"

Finally, vocabulary matters on the stock market. Two words that look similar actually refer to two very different moments in a security's life.

- **Subscription**: it happens at the security's initial issuance, that is, when it is sold for the very first time. At that moment, you subscribe at what is called the **par value**, the base price written on the security.
- **Buying**: it comes later, on the **secondary market**, the second-hand market. The security has already been issued, and you buy it from another investor. This time, you no longer pay the par value, but the **market price**, which fluctuates with supply and demand.

## The essentials to remember

- The capital market is used to raise long-term money, through the issuance of securities.
- A security represents either an ownership right or a debt.
- A share = an ownership stake in the company.
- A bond = a loan, remunerated by coupons; the Treasury bill is its government-issued version, reputed to be very safe.
- An option gives a right, never an obligation.
- You subscribe at the par value at issuance; you buy at the market price on the secondary market.`,
    quiz: [
      {
        q: "Above all, what is the capital market for, for companies and governments?",
        options: [
          "To exchange foreign currencies day to day",
          "To raise funds to finance long-term projects and activities",
          "To grant consumer credit to households",
          "To pay employees' salaries every month",
        ],
        answer: 1,
        explanation:
          "The capital market is where companies, governments and large institutions come to raise money to finance their long-term projects.",
      },
      {
        q: 'In finance, a "security" is a financial document that legally proves:',
        options: [
          "A tax owed to the State",
          "The opening of a bank account",
          "Either an ownership right or a debt",
          "Insurance against the issuer's bankruptcy",
        ],
        answer: 2,
        explanation:
          "A security is legal proof that represents either an ownership right over the company or a debt that is owed to you.",
      },
      {
        q: "When you buy a share, you are buying:",
        options: ["An equity security", "A debt security", "A Treasury bill", "An option contract"],
        answer: 0,
        explanation:
          "The share is the equity security par excellence, since it represents an ownership stake in the company.",
      },
      {
        q: "A company is divided into 100 equal parts and you buy 5 shares. What can you conclude?",
        options: [
          "You have lent money to the company for 5 years",
          "You hold 5 bonds of this company",
          "You own nothing until a coupon is paid",
          "You own 5% of this company",
        ],
        answer: 3,
        explanation:
          "With 5 shares out of 100 equal parts, you are literally the owner of 5% of the company.",
      },
      {
        q: "What are the regular interest payments made to a bondholder called?",
        options: ["Dividends", "Coupons", "Capital gains", "Risk premiums"],
        answer: 1,
        explanation:
          "The issuer of a bond commits to making regular interest payments called coupons.",
      },
      {
        q: "In the bond mechanism, who plays the role usually held by the bank in a classic loan?",
        options: [
          "The company issuing the security",
          "The government, in all cases",
          "The investors, who lend their money to the issuer",
          "The rating agencies",
        ],
        answer: 2,
        explanation:
          "A bond works like a loan, except that it is the investors, not a bank, who lend the money to the issuer.",
      },
      {
        q: "Which of these statements correctly describes a Treasury bill?",
        options: [
          "It is issued by the government and considered a very safe investment",
          "It is a share of a state-owned company",
          "It is an equity security issued by banks",
          "It is a very high-risk speculative investment",
        ],
        answer: 0,
        explanation:
          "A Treasury bill is a bond issued directly by the government to finance its spending, and it is considered a very safe investment.",
      },
      {
        q: "What exactly does an option give its holder?",
        options: [
          "The obligation to buy an asset at a future date",
          "An ownership right over the issuing company",
          "A guarantee that the invested capital will be repaid",
          "The right, but not the obligation, to buy or sell an asset at a price set in advance",
        ],
        answer: 3,
        explanation:
          "An option is a contract that gives the right, and absolutely not the obligation, to buy or sell an asset at a price set in advance for a future date.",
      },
      {
        q: 'We talk about "subscription":',
        options: [
          "When a security is resold between two investors",
          "At the security's initial issuance, at its par value",
          "When calculating the value of a stock market index",
          "When the issuer goes bankrupt",
        ],
        answer: 1,
        explanation:
          "Subscription corresponds to the security's initial issuance, sold for the first time at its par value.",
      },
      {
        q: "You buy an already-issued security from another investor on the secondary market. What price do you pay?",
        options: [
          "The par value written on the security",
          "A price set once and for all by the issuer",
          "The market price, which fluctuates with supply and demand",
          "Nothing, the security is simply transferred",
        ],
        answer: 2,
        explanation:
          "On the secondary market, you no longer pay the par value but the market price, which varies with supply and demand.",
      },
    ],
  },
  "bourse-de-casablanca-et-ses-acteurs": {
    title: "Discovering the Bourse de Casablanca and Its Players",
    summary:
      "Identify the players of the Moroccan stock market (AMMC, Bourse de Casablanca, Maroclear, intermediaries) and the role of each one.",
    content: `## What you will understand

The Moroccan stock market is not run by a single entity. It is an ecosystem in which each player has a very precise role: a referee, an organiser, a vault and intermediaries. Here is how it all fits together.

## From the trading floor to digital: the history of securities

There was a time, in Morocco **before 1998**, when buying a share meant receiving a **physical certificate** — an actual piece of paper that was handed to you.

That era is over. The image of traders shouting with papers in hand no longer exists.

- Since **1998**, the Moroccan market has undergone major reforms.
- Securities have been completely **dematerialised**: they no longer exist in paper form.
- They now take a **book-entry** form, that is, purely electronic.
- The market has become electronic and decentralised.

Remember this word: today, financial securities exist in book-entry form, no longer in material or physical form.

## The AMMC: the market watchdog

In a 100% digital market, you need a referee to guarantee trust. That is the role of the **AMMC**, the Autorité Marocaine du Marché des Capitaux (Moroccan Capital Market Authority).

- It is an **independent public institution**.
- Its main mission: to **protect the savings** that investors place on the stock market.
- It ensures the **equal treatment** of savers.
- It ensures the **transparency of information**.
- It exercises **strict supervision** over all the professionals operating on the market.

In short, the AMMC does not set prices and does not buy shares for you: it monitors, supervises and protects.

## The Bourse de Casablanca: the organiser

Contrary to what one might think, the **Bourse de Casablanca** is not a ministry. It is a **private-law company** to which the State has granted the management of the stock market.

Concretely, it is the one that:

- grants the **admission to listing** of companies, when they go public;
- pronounces their **delisting**, when they leave the market;
- ensures the **recording** and **publication** of all the transactions that take place on it.

It therefore organises the market and makes it visible, but it does not keep your securities.

## Maroclear: the central vault

Since securities no longer exist on paper, where are they stored? This is where **Maroclear** comes in, Morocco's **Central Securities Depository**, created during the 1998 reforms.

- It is the **only authorised institution** allowed to hold dematerialised securities.
- It is Maroclear that monitors the accounting of securities and **officially records who owns what**.
- This role makes it easier for securities to circulate between buyers and sellers.

Without Maroclear, no one could prove that they really own their shares.

## Your mandatory intermediaries

As an individual, the law does not allow you to knock on the door of the Bourse de Casablanca to buy a share directly. The capital market is **intermediated**: access necessarily goes through a licensed professional.

Two families of intermediaries assist you.

- **Brokerage firms (Sociétés de Bourse, SDB)**: created after **1993**, these companies have as their main activity routing your stock orders to the trading system and executing them. They act as go-betweens for buyers and sellers.
- **Custodians (account keepers)**: these are generally banks or brokerage firms that have received a special authorisation to keep your account. They hold your dematerialised securities and manage your money, that is, the cash linked to your stock market investments.

## Key takeaways

- Before 1998, securities were pieces of paper; since then, they have been in book-entry form.
- The AMMC supervises and protects invested savings.
- The Bourse de Casablanca, a private-law concession company, admits, delists and records.
- Maroclear holds the dematerialised securities and keeps the register of owners.
- Brokerage firms execute your orders; custodians keep your securities and your cash.
- You cannot act on the market alone: you must go through a licensed professional.`,
    quiz: [
      {
        q: "In Morocco, what form did shares take before 1998?",
        options: [
          "Gold bars kept in bank vaults",
          "Cryptocurrencies",
          "Physical certificates, actual pieces of paper",
          "E-mails sent by the exchange",
        ],
        answer: 2,
        explanation:
          "Before 1998, buying a share meant receiving a physical certificate — an actual piece of paper.",
      },
      {
        q: "Today, how is the form of financial securities in Morocco described?",
        options: ["Book-entry (scriptural)", "Material", "Physical", "Provisional"],
        answer: 0,
        explanation:
          "Since dematerialisation, securities no longer exist on paper but in book-entry form, that is, purely electronic.",
      },
      {
        q: "What does the acronym AMMC stand for?",
        options: [
          "Agence Marocaine de la Monnaie et du Crédit",
          "Association Marocaine des Marchés Commerciaux",
          "Autorité Mondiale des Marchés Centralisés",
          "Autorité Marocaine du Marché des Capitaux",
        ],
        answer: 3,
        explanation:
          "The AMMC is the Autorité Marocaine du Marché des Capitaux (Moroccan Capital Market Authority).",
      },
      {
        q: "What is the AMMC's main mission?",
        options: [
          "Setting the price of all listed shares every day",
          "Lending money to beginner investors who ask for it",
          "Protecting invested savings and ensuring the transparency of information",
          "Buying back the shares of companies in financial difficulty",
        ],
        answer: 2,
        explanation:
          "The AMMC's main mission is to protect the savings placed on the stock market and to ensure the transparency of information as well as the supervision of professionals.",
      },
      {
        q: "What is the legal status of the Bourse de Casablanca?",
        options: [
          "A ministry attached to the Moroccan government",
          "A private-law company to which the State has granted the management of the market",
          "A non-profit association funded by the listed banks",
          "The central bank in charge of issuing the national currency",
        ],
        answer: 1,
        explanation:
          "The Bourse de Casablanca is not a ministry: it is a private-law company that manages the stock market under a State concession.",
      },
      {
        q: "Who grants a company's admission to listing or its delisting?",
        options: [
          "The Bourse de Casablanca, the company managing the market",
          "Maroclear, the central depository of securities",
          "All retail investors, by a vote",
          "The custodian of the company concerned",
        ],
        answer: 0,
        explanation:
          "It is the Bourse de Casablanca that grants admission to listing and pronounces the delisting of companies.",
      },
      {
        q: "What is Maroclear's main mission?",
        options: [
          "Routing stock orders to the trading system",
          "Supervising market professionals and protecting savings",
          "Granting companies' admission to listing",
          "Holding dematerialised securities and recording who owns what",
        ],
        answer: 3,
        explanation:
          "Maroclear, the central depository created in 1998, is the only institution authorised to hold dematerialised securities and to officially record their owners.",
      },
      {
        q: 'The Moroccan capital market is said to be "intermediated". This means that:',
        options: [
          "anyone can buy their shares directly from the exchange",
          "you must go through a licensed professional",
          "the market is reserved for international companies only",
          "prices are negotiated solely by the Moroccan State",
        ],
        answer: 1,
        explanation:
          "An intermediated market means that access necessarily goes through a licensed professional; an individual cannot act alone.",
      },
      {
        q: "What is the main activity of a brokerage firm (SDB)?",
        options: [
          "Recording and publicising all transactions",
          "Keeping old paper certificates in secure vaults",
          "Routing its clients' orders to the trading system and executing them",
          "Controlling the transparency of financial information",
        ],
        answer: 2,
        explanation:
          "Brokerage firms, created after 1993, route their clients' orders to the trading system and execute them.",
      },
      {
        q: "What is the role of a custodian (account keeper)?",
        options: [
          "It holds your dematerialised securities and manages the cash linked to your investments",
          "It runs the stock exchange on behalf of the State",
          "It monitors suspicious transactions on the market",
          "It assesses the solvency of borrowing states",
        ],
        answer: 0,
        explanation:
          "The custodian, generally an authorised bank or brokerage firm, holds its clients' dematerialised securities and manages the associated cash.",
      },
    ],
  },
  "prix-valeur-et-capitalisation": {
    title: "Price, Value and Market Capitalisation",
    summary:
      "Distinguish par value from market price, calculate a market capitalisation, and understand the free float, the stock split and the MASI.",
    content: `## What you will learn

A share has several "prices" and several ways of being measured. In this module, you will learn to tell par value apart from market price, to measure the true size of a listed company, to understand what is really available to buy, and to read the thermometer of the Moroccan market: the MASI.

## Par value or market price: stop mixing them up

When people talk about a share, there are two very different prices to understand.

- The **par value**: this is the share's "manufacturing price". It is the base amount written on the security at its initial issuance. This value is fixed and does not change every day.
- In Morocco, the law prohibits issuing a share with a par value below **10 dirhams**.
- The **market price**: this is the price at which the share is bought and sold every day on the **secondary market**. This price fluctuates constantly with supply and demand.

Keep this consequence in mind: a share's market price does not necessarily reflect its original par value. A share issued at 10 dirhams can trade for much more, or much less, years later.

## Market capitalisation: the "size" of the company

If you want to know how much a company "weighs" on the market, definitely do not look at the price of a single share. That price only shows into how many parts the capital has been divided: on its own, it says nothing about the size of the company.

What you should look at is the **market capitalisation**.

- It is the total value of all the company's shares on the market.
- The formula is simple: the share price multiplied by the number of shares in circulation.
- Example: if a company has 1 million shares and each share is worth 50 euros on the market, its market capitalisation is 50 million euros.
- In practical terms, if you wanted to buy the entire listed company, this is the price you would have to pay.

## The free float: what is really available

Not all of a company's shares are necessarily for sale on the market. The **free-float market capitalisation** (or **free float**) is the portion of shares that is actually available for the public to buy and sell.

- Shares held by the founders, the State or majority shareholders are excluded from this calculation.
- Why? Because these shareholders hold their stakes strategically and do not sell them on a daily basis.
- Why the free float matters: generally, the higher a company's free float, the more buyers and sellers there are, and the more **liquid** its share is — meaning easy to buy and to resell.

## The stock split: cutting the slice of cake in two

Sometimes a share's price becomes too high and puts off small investors. The company can then carry out a **stock split**.

- This consists of dividing the existing shares into several new shares.
- Example: if you held one share at MAD 1,000 and the company divides it by 10, you end up with 10 shares at MAD 100.
- The result: the par value of each share falls, but your total investment and the company's market capitalisation remain exactly the same.

A stock split therefore does not make you richer and does not make anyone poorer: it simply makes the share more accessible.

## Stock market indices: the MASI

To know whether the Bourse de Casablanca is "up" or "down" overall, you use a **stock market index**, a kind of market thermometer: the **MASI**.

- The MASI is an index calculated from the free-float market capitalisation of the companies.
- Not all companies carry the same weight in the index: a very large company will influence the MASI much more than a small SME.
- There are also narrower indices, such as the **MASI 20**, which groups only the 20 companies with the largest market capitalisation on the exchange.

## Key takeaways

- Par value = fixed issuance price, minimum 10 dirhams in Morocco; market price = the daily price that fluctuates.
- Market capitalisation = share price × number of shares in circulation.
- Free float = the portion that can actually be traded; the higher it is, the more liquid the share.
- Stock split = more shares, cheaper, same market capitalisation and same total investment.
- MASI = market trend index, based on free-float market capitalisation; MASI 20 = the 20 largest capitalisations.`,
    quiz: [
      {
        q: "What is the par value of a share?",
        options: [
          "The price at which the share trades every day on the market",
          "The total value of the company on the market",
          "The base amount written on the security at its initial issuance",
          "The amount of dividends paid each year",
        ],
        answer: 2,
        explanation:
          'The par value is the "manufacturing price" of the share, written on the security at the time of its initial issuance.',
      },
      {
        q: "In Morocco, below which par value does the law prohibit issuing a share?",
        options: ["1 dirham", "10 dirhams", "50 dirhams", "100 dirhams"],
        answer: 1,
        explanation: "Moroccan law prohibits issuing a share with a par value below 10 dirhams.",
      },
      {
        q: "Is a share's market price necessarily equal to its par value?",
        options: [
          "No, it fluctuates constantly with supply and demand",
          "Yes, the law requires the two to be equal",
          "Yes, except during an economic crisis",
          "No, it is always worth exactly double",
        ],
        answer: 0,
        explanation:
          "The market price changes every day with supply and demand and therefore does not necessarily reflect the original par value.",
      },
      {
        q: "How do you calculate a company's market capitalisation?",
        options: [
          "Par value multiplied by the free float",
          "Share price divided by the number of shareholders",
          "Total debt added to share capital",
          "Share price multiplied by the number of shares in circulation",
        ],
        answer: 3,
        explanation:
          "Market capitalisation is the total value of the shares, i.e. the share price multiplied by the number of shares in circulation.",
      },
      {
        q: "A company has 1 million shares and each share is worth 50 euros on the market. What is its market capitalisation?",
        options: ["50 million euros", "5 million euros", "1 million euros", "500,000 euros"],
        answer: 0,
        explanation:
          "1 million shares multiplied by 50 euros gives a market capitalisation of 50 million euros.",
      },
      {
        q: "What does the free-float market capitalisation, or free float, refer to?",
        options: [
          "Shares that have not yet been created by the company",
          "The portion of shares actually available for the public to buy and sell",
          "Shares held by the founders and the State",
          "Shares of companies in financial difficulty",
        ],
        answer: 1,
        explanation:
          "The free float is the portion of shares genuinely available to the public, excluding in particular the stakes of founders, the State and majority shareholders.",
      },
      {
        q: "What is generally the advantage of a high free float for a share?",
        options: [
          "It automatically becomes more expensive",
          "It can never fall again",
          "It escapes all market fluctuations",
          "It is more liquid, and therefore easier to buy and resell",
        ],
        answer: 3,
        explanation:
          "A high free float means more buyers and sellers, which makes the share more liquid.",
      },
      {
        q: "During a stock split, what happens to the par value of each share and to the company's market capitalisation?",
        options: [
          "Both increase proportionally",
          "The par value falls and the market capitalisation stays exactly the same",
          "The par value stays unchanged and the market capitalisation is divided",
          "Both are halved",
        ],
        answer: 1,
        explanation:
          "A split divides the existing shares: the par value of each share falls, but the total investment and the market capitalisation remain identical.",
      },
      {
        q: "On what basis is the MASI calculated?",
        options: [
          "The number of employees of the listed companies",
          "The total number of shares issued since the exchange was created",
          "The free-float market capitalisation of the companies",
          "The combined revenue of the listed companies",
        ],
        answer: 2,
        explanation:
          "The MASI is an index calculated from the free-float market capitalisation of the companies.",
      },
      {
        q: "What does the MASI 20 group together?",
        options: [
          "The 20 companies with the largest market capitalisation on the exchange",
          "The 20 most recently listed companies",
          "Shares whose price is set at 20 dirhams",
          "The 20 oldest companies on the exchange",
        ],
        answer: 0,
        explanation:
          "The MASI 20 is a narrower index that groups only the 20 companies with the largest market capitalisation.",
      },
    ],
  },
  "pourquoi-investir-et-gerer-le-niveau-de-risque": {
    title: "Why Invest and Manage Your Risk Level",
    summary:
      "Understand the risk/return trade-off, the three major stock market risks, bankruptcy, and the role of OPCVM funds.",
    content: `## Saving or investing: the great dilemma

Leaving your money sitting in a current account or a **savings** account is very reassuring. It is very **liquid**: you can access it at any time, and there is less risk of losing your capital. The problem? It earns very little.

Conversely, **investing** in the stock market exposes you to more risk, but it is associated with a potentially much higher return.

This is what finance calls the famous **Risk / Return** trade-off: there is no high return without accepting a certain dose of risk.

## The 3 major stock market risks

On the stock market, it is essential to keep in mind that there is no investment without risk. Here are the three main ones to know.

- **Issuer risk** (or specific risk): this is the risk linked to the health of the company itself. If you are a shareholder and the company is doing badly (losses, industrial decline), its share price will fall and you will receive no dividends. If you bought a bond, the risk is that the company simply can no longer repay you.
- **Market risk**: this is the risk that the whole market falls at the same time (for example during a global crisis like COVID), no matter whether your company is healthy or not. The price moves under the effect of global supply and demand.
- **Liquidity risk**: this is the inability to sell your shares quickly without dragging their price down. It happens when a share is in very low demand — in other words, when there are few buyers facing you.

Remember that not all assets have the same level of liquidity: some securities are in much lower demand than others, and therefore much harder to resell at the right price.

## Company health: solvency and liquidity

To assess issuer risk, you need to look at two key indicators of the company.

- **Solvency**: this is the company's ability to pay its long-term debts. It measures the company's viability and financial health over time.
- **Liquidity**: this is the company's ability to quickly convert its assets into cash to pay what it owes in the short term.

The two do not say the same thing: a company can be solid over the long term but short of immediately available cash, and vice versa.

## The worst-case scenario: bankruptcy and liquidation

What happens if the company you invested in is doing very badly? There are several steps.

- First, a **court-supervised recovery (redressement judiciaire)** is attempted.
- Then comes the **reorganisation**: the strategy is changed or costs are cut to avoid bankruptcy.
- If all of that fails, it is **liquidation**: the company is dissolved and everything it owns is sold to repay those it owes money to.

The order of repayment is crucial. The **State** is repaid first, then the **creditors** (those holding bonds), and finally... the **shareholders**.

As a shareholder, you are therefore the very last to be repaid, and only if there is money left. This is why a share is a riskier security than a bond.

## The stress-reducing solution: OPCVM funds

If picking your own shares scares you, there is a solution: **OPCVM** funds (Organismes de Placement Collectif en Valeurs Mobilières, i.e. collective investment schemes).

- It is a fund managed by professionals.
- It pools the money of several investors.
- It invests it in many different securities: shares, bonds, etc.

The main objective of this technique is to reduce risk by not putting all your eggs in one basket. You no longer depend on the fate of a single company, but on a set of securities, which softens issuer risk.

## Key takeaways

- Savings are reassuring and stay available, but earn little; investing potentially earns more, in exchange for more risk.
- Three risks to watch: issuer, market, liquidity.
- Solvency (long term) and liquidity (short term) help you judge a company's health.
- In a liquidation, the shareholder comes last, after the State and the creditors.
- OPCVM funds allow you to diversify and to entrust management to professionals.`,
    quiz: [
      {
        q: "What is the main difference between traditional savings and stock market investing?",
        options: [
          "Savings are riskier than investing",
          "Investing offers less return than savings",
          "Savings offer less risk but less return, while investing exposes you to more risk for more return",
          "Investing is always more liquid than savings",
        ],
        answer: 2,
        explanation:
          "The lesson contrasts savings — reassuring and liquid but low-yielding — with investing, which is riskier but offers a potentially much higher return.",
      },
      {
        q: "In finance, what is the relationship between the hoped-for gain and the danger of losing your money called?",
        options: [
          "The Solvency / Liquidity ratio",
          "The Risk / Return trade-off",
          "The Supply / Demand ratio",
          "The Issuer / Market ratio",
        ],
        answer: 1,
        explanation:
          "It is the Risk / Return trade-off: there is no high return without accepting a certain dose of risk.",
      },
      {
        q: 'For a shareholder, what is "issuer risk"?',
        options: [
          "The risk linked to the poor health of the company, leading to a falling share price and no dividends",
          "The risk that the whole financial market collapses at the same time",
          "The risk of finding no one to buy back your share",
          "The risk that the company is taken over by a competitor",
        ],
        answer: 0,
        explanation:
          "Issuer risk, or specific risk, is the one linked to the health of the company itself: if it struggles, the price falls and dividends disappear.",
      },
      {
        q: "What is the main issuer risk for someone holding a bond?",
        options: [
          "That the bond becomes too liquid",
          "That the market as a whole falls",
          "That the company decides to lower its selling prices",
          "That the company can no longer repay them",
        ],
        answer: 3,
        explanation:
          "For a bondholder, issuer risk is that the company is simply no longer able to repay them.",
      },
      {
        q: 'How is "market risk" defined?',
        options: [
          "It is the inability to sell an asset quickly without knocking its price down",
          "It is the risk that the whole market falls at the same time, as in a global crisis, no matter how healthy your company is",
          "It is the risk that the company goes bankrupt because of bad products",
          "It is the risk that the company pays no dividend this year",
        ],
        answer: 1,
        explanation:
          "Market risk affects the whole market at once, through global supply and demand, regardless of the company's quality.",
      },
      {
        q: 'What is "liquidity risk" on the stock market?',
        options: [
          "The fact that a share changes price every minute",
          "The risk that the company no longer has enough money to pay its employees",
          "The inability to sell your shares quickly without dragging their price down, for lack of buyers",
          "The risk that the dividend paid is lower than expected",
        ],
        answer: 2,
        explanation:
          "Liquidity risk appears when a share is in very low demand: you cannot sell it quickly without dragging its price down.",
      },
      {
        q: 'When analysing a company, what does its "solvency" measure?',
        options: [
          "Its ability to pay its long-term debts, and therefore its viability over time",
          "Its ability to quickly convert its assets into cash",
          "The number of its employees and sites",
          "The amount of dividends it pays each year",
        ],
        answer: 0,
        explanation:
          "Solvency measures the company's ability to pay its long-term debts, and therefore its financial health over time.",
      },
      {
        q: "If court-supervised recovery and then reorganisation fail, what happens to the company?",
        options: [
          "It is automatically bought by the State",
          "It is forced to go public",
          "It carries out a capital increase",
          "It is liquidated: it is dissolved and its assets are sold to repay what it owes",
        ],
        answer: 3,
        explanation:
          "Liquidation is the final step: the company is dissolved and everything it owns is sold to repay its creditors.",
      },
      {
        q: "In a liquidation, in what order are repayments made?",
        options: [
          "Shareholders, then creditors, then the State",
          "The State, then bondholding creditors, then shareholders",
          "Creditors, then shareholders, then the State",
          "Everyone is repaid at the same time, in equal shares",
        ],
        answer: 1,
        explanation:
          "The State is repaid first, then the bond creditors, and finally the shareholders if any money is left.",
      },
      {
        q: "What does the acronym OPCVM stand for, and what is its main objective?",
        options: [
          "A State-guaranteed savings contract, whose goal is to offer a fixed return",
          "A tax on stock market capital gains, whose goal is to fund the market",
          "An Organisme de Placement Collectif en Valeurs Mobilières (collective investment scheme), whose goal is to pool money from several investors into different securities to reduce risk",
          "A special stock market order, whose goal is to buy at the best price",
        ],
        answer: 2,
        explanation:
          "An OPCVM is an Organisme de Placement Collectif en Valeurs Mobilières — a professionally managed fund that diversifies investments to reduce risk.",
      },
    ],
  },
};

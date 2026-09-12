import type { LessonTranslation } from "./types";

/**
 * English translation of the Intermédiaire level — French source of truth
 * lives in the `lessons` table (static curriculum, repo-held translations).
 */
export const EN_INTERMEDIAIRE: Record<string, LessonTranslation> = {
  "entree-en-bourse-appel-public-a-lepargne": {
    title: "Going Public (the Public Offering)",
    summary:
      "Understand the public offering, the difference between the primary and secondary markets, and the role of the Prospectus approved by the AMMC.",
    content: `## Why a company opens its doors to the public

Imagine a successful Moroccan company with big development plans, but which no longer wants to rely solely on bank loans. It decides to turn to investors, both retail and institutional, to raise funds.

In finance, this move has a precise name: it is a **public offering (Appel Public à l'Épargne, APE)**.

## The public offering (APE)

The APE is not a simple commercial transaction: it is a **very strict legal and regulatory framework**.

- It governs the moment when an **issuer** (the company) solicits savings from the public so that it buys its **financial instruments**, in other words shares or bonds.
- It involves, in particular, the use of **cold calling** (unsolicited approaches, for example a share offer by phone or at a branch), **advertising**, or the services of a **financial intermediary** tasked with selling the securities.
- The advantage for the company is clear: it can reach a very large number of potential investors to finance its growth, instead of being limited to a handful of backers.

## The primary market: the "brand-new" market

Going public takes place on what is called the **primary market**.

- Put simply, the primary market is the **market for the brand-new**: it is where new products are created for new buyers.
- This is the stage at which the **subscription** takes place: you buy the shares directly from the company, at their very first issue. It can also happen when the founding shareholders decide to sell part of their own securities to the public.
- Essential point: the money from your purchase goes, for the most part, straight into the company's coffers. That is where the financing really happens.

## The secondary market: the "second-hand" market

Once the company has completed its IPO (stock market listing), its shares start changing hands every day between investors. This is what is called the **secondary market**.

- The secondary market is the one on which the exchange of **securities that already exist** is organised. It is, in a way, the rental or second-hand market.
- On this market, if you buy a share, the money you pay no longer goes to the company: it goes to the investor who is selling you their share.

Remember the difference well: on the primary market, the company raises financing; on the secondary market, investors pass securities among themselves.

## The Prospectus and the AMMC Visa: transparency above all

You cannot ask the public for money in just any way. A public offering requires a **very high level of transparency** from the company, with the obligation to publish a large amount of information.

- The very first official act that triggers the stock market admission process is obtaining a **Visa** on a document called the **Prospectus**.
- This Prospectus is an essential information document, which must be approved by the market authorities, namely the **AMMC**.
- Before the 2019 reform, this document was called the **information memorandum (note d'information)**.

Since 2019, the Prospectus has been made up of two main parts:

- The **registration document (document de référence)**, which contains all the information about the company's health and business. Its validity period is **9 months**.
- The **securities note (note d'opération)**, which explains the practical arrangements for the stock market listing and the sale of the securities.

Without the AMMC's Visa on this prospectus, the company simply does not have the right to go public.

## Key takeaways

- The APE is the strict framework that allows a company to solicit public savings to buy its shares or bonds.
- The primary market is the market for the brand-new: you subscribe to newly issued securities there, and the money finances the company.
- The secondary market is the second-hand market: already-existing securities are traded there, between investors.
- Nothing happens without transparency: a Prospectus approved by the AMMC, made up of the registration document (valid for 9 months) and the securities note.`,
    quiz: [
      {
        q: "What does the acronym APE stand for in stock market terms?",
        options: [
          "Public Company Action",
          "Appel Public à l'Épargne (public offering)",
          "Economic Pricing Agency",
          "Prior Issuance Authorisation",
        ],
        answer: 1,
        explanation:
          "APE is the abbreviation of Appel Public à l'Épargne (public offering), the framework governing the solicitation of savings from the public.",
      },
      {
        q: "Concretely, what is a public offering?",
        options: [
          "An operation by which a company solicits savings from the public to finance itself",
          "Financial aid given by the government to companies",
          "A ban on a company selling its shares",
          "A tax levied on savings accounts",
        ],
        answer: 0,
        explanation:
          "The APE is the legal framework governing the moment when an issuer solicits savings from the public so that it buys its financial instruments.",
      },
      {
        q: "What is the market called on which securities are issued for the very first time?",
        options: [
          "The secondary market",
          "The money market",
          "The primary market",
          "The second-hand market",
        ],
        answer: 2,
        explanation:
          'The primary market is the market of the first issue of securities, the "brand-new" market.',
      },
      {
        q: "Which image is often used to describe the primary market?",
        options: [
          "It is the second-hand market",
          "It is a casino",
          "It is the rental market",
          "It is the market for the brand-new",
        ],
        answer: 3,
        explanation:
          "The primary market is presented as the market for the brand-new, because new securities are created there for new buyers.",
      },
      {
        q: "What is the act of buying a security on the primary market at the time of its issue called?",
        options: ["Delisting", "Subscription", "Liquidation", "Cold calling"],
        answer: 1,
        explanation:
          "Buying a security directly from the company at its first issue is called a subscription.",
      },
      {
        q: "On the secondary market, who gets the money you pay when you buy a share?",
        options: [
          "The issuing company, as on the primary market",
          "The AMMC, which then redistributes the funds",
          "The investor selling you their share",
          "The employees of the listed company",
        ],
        answer: 2,
        explanation:
          "On the secondary market, the securities already exist and the money goes to the seller, no longer to the company.",
      },
      {
        q: "What happens on the secondary market?",
        options: [
          "Investors exchange securities that have already been issued",
          "The company creates new shares every day",
          "The government sets share prices",
          "Companies apply for bank loans",
        ],
        answer: 0,
        explanation:
          "The secondary market organises the exchange of already-existing securities between investors.",
      },
      {
        q: "What level of requirement applies to a company making a public offering?",
        options: [
          "No information is required",
          "The company only provides its name and address",
          "Only foreign companies are audited",
          "A very high level of transparency, with the publication of a large amount of information",
        ],
        answer: 3,
        explanation:
          "A public offering requires a very high level of transparency and the obligation to publish a large amount of information.",
      },
      {
        q: "What is the very first official act that triggers the stock market admission process?",
        options: [
          "Creating a website dedicated to shareholders",
          "Obtaining the AMMC's Visa on the Prospectus",
          "The signature of the head of the Bourse de Casablanca",
          "The first listing of the share",
        ],
        answer: 1,
        explanation: "The admission process starts with obtaining an AMMC Visa on the Prospectus.",
      },
      {
        q: "How long is the registration document, which contains the information about the issuer, valid?",
        options: ["1 month", "5 years", "9 months", "It is valid for life"],
        answer: 2,
        explanation:
          "The registration document, one of the two parts of the Prospectus since 2019, is valid for 9 months.",
      },
    ],
  },
  "analyse-fondamentale-et-ratios-cles": {
    title: "Fundamental Analysis and Key Ratios",
    summary:
      "Calculate and interpret EPS, the P/E ratio and the dividend yield to judge whether a share is expensive or cheap.",
    content: `## Fundamental analysis: looking under the bonnet

When investing in the stock market, there are two broad ways to pick a share. Either you look only at curves and charts — that is **technical analysis**. Or you look at the company's true financial health, and that is where **fundamental analysis** comes in.

The goal of fundamental analysis is simple: to try to determine whether the share's current market price is justified relative to what the company actually earns.

Good news: you do not need to be a chartered accountant. You just need to master three essential indicators (known as **ratios**).

## EPS: what your share earns

Imagine a company makes a net profit of 10 million dirhams at the end of the year. That is nice, but if the company has 100 million shares outstanding, your slice of the cake is tiny. That is exactly what **EPS (earnings per share)** measures.

- The calculation: you divide total net profit by the number of shares outstanding.
- The example: if the company makes 10 million DH in profit and there are 1 million shares, EPS is 10 DH.
- The use: it tells you exactly how much wealth was created for each share you own.

EPS is the absolute foundation for knowing whether a company is profitable.

## The P/E ratio: the expensiveness thermometer

The **P/E ratio (price-to-earnings ratio)** is by far the most famous ratio in the stock market. It lets you quickly tell whether a share is "expensive" or "cheap".

- The calculation: you take the share's market price and divide it by EPS.
- The example: if the share sells for 150 DH on the market and its EPS is 10 DH, the P/E ratio is 15 (150 / 10).
- What it concretely means: a P/E ratio of 15 means you agree to pay 15 years of current earnings to buy the company.

How to interpret it, generally:

- A low P/E ratio (for example 8) can mean the share is undervalued and a good deal… or that the company is in danger.
- A very high P/E ratio (for example 40) means the share is very expensive, often because investors expect earnings to explode in the future, as with technology companies.

## The dividend yield: immediate cash

Some investors could not care less whether the share will go up or down in 10 years: they want cash right now. This is where the **dividend yield** comes in.

- The calculation: it is the dividend paid divided by the share price, all multiplied by 100 to obtain a percentage.
- The example: you buy a share at 100 DH. The company decides to pay a dividend of 5 DH per share. The yield on your investment is 5%.
- The use: it lets you compare this stock market investment with a conventional product, like a savings account at 2% or a Treasury bill at 3%.

## The golden rule: only compare what is comparable

Beware of the classic beginner's trap: you never compare the P/E ratio of a bank with the P/E ratio of a food-processing or property company.

- Each sector has its own growth and expense dynamics.
- A bank like **Attijariwafa Bank** will naturally have very different ratios from a port operator like **Marsa Maroc**.
- The golden rule of fundamental analysis is **sector comparison**: if you want to know whether a bank's P/E ratio is attractive, compare it with the P/E ratios of other Moroccan banks, or with that same bank's historical average.

## Key takeaways

- Fundamental analysis seeks to know whether the market price is justified by the company's real results.
- EPS measures profitability per share: net profit / number of shares.
- The P/E ratio measures expensiveness: share price / EPS, and is expressed in "years of earnings".
- The dividend yield measures immediate cash: dividend / share price, as a percentage.
- A ratio means nothing on its own: it only takes on meaning when compared with the same sector or with the company's history.`,
    quiz: [
      {
        q: "What is the main objective of fundamental analysis?",
        options: [
          "Studying only the charts to guess whether the share will rise tomorrow",
          "Assessing the company's true financial health to know whether its market price is justified",
          "Calculating the taxes the company will have to pay at the end of the year",
          "Finding the exact moment when the market will collapse",
        ],
        answer: 1,
        explanation:
          "Fundamental analysis looks at the company's real financial health to judge whether the share's current price is justified.",
      },
      {
        q: "What does the acronym EPS stand for?",
        options: [
          "Projected Annual Balance Sheet",
          "Auxiliary Participation Certificate",
          "Earnings Per Share",
          "Private Purchasing Bank",
        ],
        answer: 2,
        explanation: "EPS stands for earnings per share (BPA in French: Bénéfice Par Action).",
      },
      {
        q: "How is EPS calculated?",
        options: [
          "You divide total net profit by the number of shares outstanding",
          "You divide revenue by the number of company employees",
          "You multiply the share price by the year's net profit",
          "You divide the share price by the dividend paid",
        ],
        answer: 0,
        explanation:
          "EPS is obtained by dividing total net profit by the number of shares outstanding.",
      },
      {
        q: "A company makes 50 million dirhams in net profit and has 5 million shares outstanding. What is its EPS?",
        options: ["5 DH", "25 DH", "250 DH", "10 DH"],
        answer: 3,
        explanation: "50 million divided by 5 million shares gives an EPS of 10 DH.",
      },
      {
        q: "How do you calculate a company's P/E ratio?",
        options: [
          "Dividend paid divided by the share price",
          "Share price divided by EPS",
          "Share price multiplied by the number of shares outstanding",
          "Net income divided by the company's total debt",
        ],
        answer: 1,
        explanation:
          "The P/E ratio is calculated by dividing the share's market price by earnings per share.",
      },
      {
        q: "A share sells for 150 DH and its EPS is 10 DH. What does its P/E ratio concretely mean?",
        options: [
          "That the share will pay a 15% dividend this year",
          "That the share has risen 15% since the start of the year",
          "That you agree to pay 15 years of current earnings to buy the company",
          "That the company has been listed on the stock market for 15 years",
        ],
        answer: 2,
        explanation:
          "A P/E ratio of 15 means you pay the equivalent of 15 years of the company's current earnings.",
      },
      {
        q: "What can a very high P/E ratio, like 40, generally mean?",
        options: [
          "The share is expensive because investors expect strong future earnings growth",
          "The share is undervalued and an obvious bargain",
          "The company never pays a dividend to its shareholders",
          "Earnings per share is necessarily negative",
        ],
        answer: 0,
        explanation:
          "A very high P/E ratio reflects an expensive share, often because investors anticipate an explosion of future earnings.",
      },
      {
        q: "You buy a share at 200 DH and the company pays you a dividend of 10 DH per share. What is the dividend yield?",
        options: ["10%", "2%", "20%", "5%"],
        answer: 3,
        explanation: "10 divided by 200, then multiplied by 100, gives a dividend yield of 5%.",
      },
      {
        q: "Why is the dividend yield useful?",
        options: [
          "It guarantees that the share price will rise in the coming months",
          "It lets you compare the share with a conventional product like a savings account or a Treasury bill",
          "It completely replaces the EPS and P/E ratio calculations",
          "It tells you for how many years the company has been profitable",
        ],
        answer: 1,
        explanation:
          "The dividend yield is used precisely to compare the cash received with other investments, like a savings account at 2% or a Treasury bill at 3%.",
      },
      {
        q: "What is the golden rule of fundamental analysis when using the P/E ratio?",
        options: [
          "Systematically buy the company with the lowest P/E ratio in the whole market",
          "Ignore the P/E ratio as soon as EPS exceeds 10 DH per share",
          "Only compare the P/E ratio between companies in the same sector, or with the company's own history",
          "Add the P/E ratio and the dividend yield to obtain a single score",
        ],
        answer: 2,
        explanation:
          "The golden rule is sector comparison: a bank's P/E ratio is compared with that of other banks or with its own historical average.",
      },
    ],
  },
  "augmentation-de-capital-et-dps": {
    title: "The Capital Increase and the DPS",
    summary:
      "Understand the capital increase, the dilution effect and the role of the DPS in an irreducible or reducible subscription.",
    content: `## The cash capital increase

When a company needs money to finance a new project, it can decide to carry out a **cash capital increase**.

In simple terms, this means it creates **new shares** and sells them for fresh money. The company's capital increases, and the total number of shares outstanding increases too.

## The three ways to carry out the operation

The company has three main options for opening up its capital:

- **With pre-emptive subscription rights (DPS)**: the operation is reserved as a priority for the company's current shareholders.

- **Open to the public without distinction**: anyone can buy, and the privilege (the DPS) of the existing shareholders is waived.

- **The reserved capital increase**: the company waives its shareholders' privilege to sell the new shares directly to one specific investor. This remains very rare.

## The dilution effect: your slice of the cake shrinks

Why is this privilege story so important? Because of the **dilution effect**.

Imagine you own 5 shares of a company that has 100 in total. You therefore hold 5% of the company.

If the company creates 10 new shares to raise money, there are now 110 shares in total. If you buy none of these new shares and stay with your 5 shares, you now own only 4.5% of the company (5 out of 110)! Your power and your stake in the company have been "diluted".

Be careful, though: this does not mean you lose money. The share price stays the same; only your **percentage of control** in the company decreases.

Note that the opposite phenomenon is called **accretion** (relution).

## The DPS: the shareholder's shield

To protect existing shareholders against this dilution, the law grants them a **pre-emptive subscription right (DPS)**.

- **The principle**: if you own 100 shares, you automatically receive 100 DPS. These DPS give you absolute priority to buy the new shares before the general public.

- **Reselling**: if you do not want to, or cannot, buy these new shares, you are not stuck. A DPS has value and can be sold on the stock market to other investors!

The DPS is therefore never an obligation: either you use it to maintain your stake in the company, or you sell it to someone else.

## Irreducible and reducible subscription

When buying the new shares — what is called the **subscription** — two stages are distinguished.

- **Irreducible subscription (à titre irréductible)**: if you use your own DPS to buy the shares you are entitled to, you are 100% certain to obtain them. It is guaranteed, because the offer of new securities corresponds exactly to the number of DPS created.

- **Reducible subscription (à titre réductible)**: once you have used your rights, you can ask to buy even more shares, from those that other shareholders may not have claimed. It is called "reducible" because, if overall demand is too strong relative to the remaining shares, your request will be reduced proportionally so that everyone is satisfied.

## Key takeaways

- A cash capital increase = creation of new shares sold for money.

- Without your participation, your relative stake falls: that is dilution, the opposite of accretion.

- The DPS is your shield: an automatic purchase priority, proportional to your number of shares, and resalable on the stock market.

- With your DPS (irreducible), you are certain to obtain your shares. Beyond your rights (reducible) or without DPS in a public offer, everything depends on general demand.`,
    quiz: [
      {
        q: 'What is a "cash capital increase"?',
        options: [
          "The company's buyback of its own shares",
          "The creation of new shares sold for fresh money",
          "A mandatory pay rise for employees",
          "The early repayment of the company's debts",
        ],
        answer: 1,
        explanation:
          "The lesson defines a cash capital increase as the creation of new shares sold for fresh money.",
      },
      {
        q: "How many main options does the company have to carry out this operation, according to the lesson?",
        options: ["Only one", "Two", "Three", "Five"],
        answer: 2,
        explanation:
          "The lesson presents three options: with DPS, open to the public without distinction, or reserved.",
      },
      {
        q: "In a capital increase with DPS, who is the operation reserved for as a priority?",
        options: [
          "The company's employees",
          "Foreign investors",
          "The banks that are creditors of the company",
          "The company's current shareholders",
        ],
        answer: 3,
        explanation:
          "The DPS reserves the operation as a priority for the company's current shareholders.",
      },
      {
        q: "You own 5 shares out of 100 and the company creates 10 new shares that you do not buy. What is your new percentage?",
        options: ["4.5%", "5%", "5.5%", "10%"],
        answer: 0,
        explanation: "With 5 shares out of a total now of 110, your stake falls from 5% to 4.5%.",
      },
      {
        q: "What happens to the share price during the dilution effect described in the lesson?",
        options: [
          "It automatically falls to zero",
          "It stays the same; only your ownership percentage decreases",
          "It mechanically doubles",
          "It is set by the government to offset the dilution",
        ],
        answer: 1,
        explanation:
          "The lesson specifies that dilution does not make you lose money: the price stays the same, it is the percentage of control that falls.",
      },
      {
        q: "What is the phenomenon that is the exact opposite of dilution called?",
        options: ["Dissolution", "Speculation", "Accretion", "Subscription"],
        answer: 2,
        explanation:
          "The lesson states that the opposite phenomenon is called accretion (relution).",
      },
      {
        q: "A shareholder who holds 100 shares receives how many DPS?",
        options: ["100 DPS", "10 DPS", "1 DPS", "None; DPS are bought separately"],
        answer: 0,
        explanation: "The principle is one DPS per share held, so 100 shares give 100 DPS.",
      },
      {
        q: "What can you do if you do not want to, or cannot, use your DPS?",
        options: [
          "Nothing; they are destroyed without compensation",
          "Exchange them for government bonds",
          "Mandatorily transfer them to the company",
          "Sell them on the stock market to other investors",
        ],
        answer: 3,
        explanation:
          "The lesson stresses that a DPS has value and can be sold on the stock market to other investors.",
      },
      {
        q: "Why does an irreducible subscription offer 100% certainty?",
        options: [
          "Because the government guarantees every stock market transaction",
          "Because the offer of new securities corresponds exactly to the number of DPS created",
          "Because other investors are forbidden from participating",
          "Because the company creates shares in unlimited quantities",
        ],
        answer: 1,
        explanation:
          "The guarantee comes from the fact that the number of securities offered corresponds exactly to the number of DPS created.",
      },
      {
        q: "In a reducible subscription, what happens if overall demand exceeds the remaining shares?",
        options: [
          "The operation is simply cancelled",
          "The shares are allocated by lottery",
          "Requests are reduced proportionally among subscribers",
          "The company immediately creates additional shares",
        ],
        answer: 2,
        explanation:
          'The term "reducible" comes precisely from the fact that requests are reduced proportionally when demand is too strong.',
      },
    ],
  },
  "strategies-et-suivi-de-portefeuille": {
    title: "Strategies & Portfolio Monitoring",
    summary:
      "Choose your strategy (income or growth), invest with DCA, diversify your sectors and rebalance your portfolio.",
    content: `## Choosing your style: income or growth?

Before buying your first share, you need to define your objective. In the stock market, there are two broad investment strategies.

- **The income strategy** (Value / Dividends): you target "mature" and highly profitable companies, such as large banks or telecom operators. They grow slowly, but they hand back a large part of their profits every year as **dividends**. It is ideal for building a regular passive income.

- **The growth strategy** (Growth): you target companies in full expansion. They often pay no dividend at all, because they reinvest 100% of their profits to grow even faster. Your goal is not to collect an annual income, but to see the share price explode in 5 or 10 years, to make a big **capital gain** on resale.

Neither is "better": they simply answer two different objectives — regular income on one side, future gain on resale on the other.

## The secret to stop stressing: DCA

The biggest trap in the stock market is trying to guess the "right moment" to buy: that is what is called **market timing**. It is impossible, even for professionals.

The solution is called **DCA** (Dollar-Cost Averaging), or scheduled investing.

- The principle: you invest a fixed amount, at a regular interval (for example 1,000 DH on the 5th of every month), no matter whether the market is up or down.

- The mathematical magic: when the share is expensive, your 1,000 DH buy few shares. When the share collapses and everyone panics, those same 1,000 DH buy many more shares.

- The result: over the long term, this "smooths" your average purchase price and completely removes the stress of the decision. You no longer have to wonder whether it is the right day to buy.

## Diversification: do not put all your eggs in one basket

If you invest all your money in 3 property companies and the property sector hits a crisis, your portfolio is ruined. Holding several companies from the same sector does not protect you: they all react the same way to the same crisis.

- The solution: **sector diversification**. On the Bourse de Casablanca, you need to spread your money across sectors that do not react the same way to crises.

- For example: some Banks, some Construction & Public Works (BTP)/Cement, some Food & Beverage and some Telecoms.

- The idea is simple: if one sector does badly, the others will make up for the loss.

## Monitoring and rebalancing

A stock portfolio is like a garden: it needs a minimum of upkeep. Once or twice a year is enough.

- **Rebalancing**: imagine you had decided to hold 50% banks and 50% construction. If bank shares have soared this year, they may now represent 70% of your portfolio. You are then taking too much risk on that single sector.

- The move to make: sell some of your bank shares, to lock in your gains, and buy back construction stocks to return to your 50/50 target.

## The snowball effect

For your portfolio to grow fast, the golden rule is to **reinvest your dividends**.

- Instead of spending the dividends you receive, use them to buy new shares.

- These new shares will in turn generate new dividends the following year, which will buy even more shares.

- That is the power of **compound interest**: the engine that turns a small regular investment into real capital over the long term.

## Key takeaways

- First define your objective: regular income (income strategy) or future capital gain (growth strategy).

- Forget market timing, prefer DCA: a fixed amount, on a fixed date, come what may.

- Spread your money across several sectors, not just several companies.

- Rebalance once or twice a year and systematically reinvest your dividends.`,
    quiz: [
      {
        q: "Which strategy consists of targeting mature, highly profitable companies that hand back a large part of their profits every year?",
        options: [
          "The growth strategy (Growth)",
          "The income strategy (Value / Dividends)",
          "Market timing",
          "Sector rebalancing",
        ],
        answer: 1,
        explanation:
          "The income strategy targets mature companies, such as large banks or telecom operators, which distribute a large part of their profits as dividends.",
      },
      {
        q: "Why do the companies targeted by the growth strategy often pay no dividend?",
        options: [
          "Because the law forbids young companies from distributing a dividend",
          "Because they are too mature and their shareholders prefer a quick resale",
          "Because they reinvest 100% of their profits to grow faster",
          "Because they must first repay their founding shareholders",
        ],
        answer: 2,
        explanation:
          "Companies in full expansion reinvest all of their profits in their growth instead of distributing them.",
      },
      {
        q: "You put 100% of your savings into three different property companies. Are you well diversified?",
        options: [
          "No: they all depend on the same sector",
          "Yes, because three different companies are always enough to spread risk properly",
          "Yes, because property is presented as the safest sector on the Bourse de Casablanca",
          "No, because the lesson requires holding at least fifty listed companies",
        ],
        answer: 0,
        explanation:
          "Three companies from the same sector react the same way to a crisis in that sector, so the portfolio is not diversified.",
      },
      {
        q: 'What does "market timing", presented as the biggest trap in the stock market, refer to?',
        options: [
          "Investing a fixed amount at a regular interval",
          "Spreading your money across several business sectors",
          "Bringing your portfolio back to its target percentages",
          'Trying to guess the "right moment" to buy',
        ],
        answer: 3,
        explanation:
          "Market timing consists of trying to guess the right moment to buy, which is impossible even for professionals.",
      },
      {
        q: "What does the acronym DCA stand for?",
        options: [
          "Annual Capitalised Dividend",
          "Dollar-Cost Averaging",
          "Controlled Diversification of Stock Assets",
          "Accelerated Portfolio Growth Endowment",
        ],
        answer: 1,
        explanation: "DCA means Dollar-Cost Averaging, in other words scheduled investing.",
      },
      {
        q: "Which of these behaviours correctly illustrates the DCA principle?",
        options: [
          "Investing all your capital on the day the market fell the most",
          "Investing only in months when the market is clearly rising",
          "Investing 1,000 DH on the 5th of every month, whether the market goes up or down",
          "Waiting for a signal from your brokerage firm before each payment",
        ],
        answer: 2,
        explanation:
          "DCA consists of investing a fixed amount at a regular interval, regardless of the state of the market.",
      },
      {
        q: "With DCA, what happens when the share collapses and everyone panics?",
        options: [
          "Your fixed amount buys many more shares",
          "Your fixed amount buys fewer shares than in rising markets",
          "Your monthly payment is automatically suspended by the bank",
          "Your shares are automatically converted into dividends",
        ],
        answer: 0,
        explanation:
          "As the price falls, the same fixed amount allows you to buy a larger number of shares.",
      },
      {
        q: "Which sectors does the lesson give as an example for diversifying a portfolio on the Bourse de Casablanca?",
        options: [
          "Banking, insurance, property and tourism",
          "Telecoms, mining, fishing and textiles",
          "Food & Beverage, air transport, hotels and healthcare",
          "Banks, Construction (BTP)/Cement, Food & Beverage and Telecoms",
        ],
        answer: 3,
        explanation:
          "The example given spreads money between Banks, Construction (BTP)/Cement, Food & Beverage and Telecoms.",
      },
      {
        q: "Your target was 50% banks and 50% construction, but after a strong rise banks now weigh 70% of your portfolio. What do you do to rebalance?",
        options: [
          "Nothing at all, and you let banks rise until they fill your whole portfolio",
          "You sell part of the banks and buy back construction stocks",
          "You sell your construction stocks to strengthen the winning banking position even further",
          "You borrow money to buy construction stocks without touching your bank shares",
        ],
        answer: 1,
        explanation:
          "Rebalancing consists of selling part of the sector that has grown too large to lock in the gains and buying back the other sector, in order to return to the 50/50 target.",
      },
      {
        q: "What is the mechanism called that kicks in when you reinvest your dividends year after year?",
        options: [
          "Market timing",
          "Sector diversification",
          "The power of compound interest",
          "Annual portfolio rebalancing",
        ],
        answer: 2,
        explanation:
          "Reinvesting dividends to buy shares that will in turn produce dividends is the snowball effect of compound interest.",
      },
    ],
  },
};

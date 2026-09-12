import type { LessonTranslation } from "./types";

/**
 * English translation of the Avancé level — French source of truth lives in
 * the `lessons` table (static curriculum, repo-held translations).
 */
export const EN_AVANCE: Record<string, LessonTranslation> = {
  "cotation-au-quotidien": {
    title: "Trading day to day",
    summary:
      "Understand how a trading session unfolds at the Bourse de Casablanca: the central market, the block market, thresholds, continuous trading, fixing and the Theoretical Opening Price (CTO).",
    content: `## Two rooms, two atmospheres: the central market and the block market

At the Bourse de Casablanca, not all transactions happen in the same place. The market is divided into two main segments.

- The **Central Market**: this is the public square. It is a transparent platform where "standard"-sized buy and sell orders are visible to all participants in the **order book**. This is where retail investors trade — in other words, you.

- The **Block Market**: this is the VIP lounge, reserved for institutional investors (funds, banks). It hosts very large transactions, those that exceed a **Minimum Block Size (Taille Minimum de Blocs, TMB)** set by the exchange. These trades are carried out **over the counter (OTC)**, i.e. directly between two parties.

Why separate the two? If a very large investor bought millions of shares in one go on the central market, the price would skyrocket. The block market avoids that volatility and keeps public prices undisturbed.

## Speed limits: the trading corridor

On the stock market, a share cannot see its price fall by 80% or rise by 100% in a single day. There are safeguards called **trading corridors**, or **Variation Thresholds (Seuils de Variation, SDV)**.

- For shares on the central market, the price can only move within a limit of **± 10%** relative to the previous day's price, called the **reference price**.

- There is therefore an **upper threshold** (+ 10%) and a **lower threshold** (− 10%).

- If you submit a price outside this limit, your order can remain in the order book to gain time priority, but it will only be executed once the price comes back within this range.

- Note: on the block market, the permitted variation range is wider than on the central market.

## The rhythm of the exchange: continuous trading or fixing

Not all shares attract the same enthusiasm. To manage this, the exchange uses two trading systems.

- **Continuous trading**: reserved for **liquid** shares, those in high demand. After the market opens (9:30 a.m.), prices fluctuate and transactions are executed in real time throughout the day, as soon as a buyer and a seller agree.

- **Fixing (auction)**: reserved for **illiquid** shares, those in low demand. Instead of trading all day, the exchange silently accumulates orders and holds a single matching, at a precise time, to set one single price for the trading session.

## The market opening: the CTO

Even before transactions begin in the morning, the exchange's algorithm accumulates orders and calculates the **Theoretical Opening Price (Cours Théorique d'Ouverture, CTO)**.

- The algorithm's objective is simple: it looks for the exact price that will allow the largest possible quantity of shares to be executed. The chosen price **always maximises the quantities traded**.

- If the calculated CTO exceeds the upper threshold (+ 10%) or the lower threshold (− 10%), the market price will be set at the corresponding threshold, in order to limit fluctuations.

- If there is no compatibility between buyers and sellers (for example if buyers offer 100 MAD while sellers demand 120 MAD), then there is no transaction, and the CTO simply does not exist for that session.

## What to remember

- Central market for standard, public orders; block market for very large over-the-counter volumes.
- Maximum variation of ± 10% per session on the central market, calculated on the previous day's reference price.
- Continuous trading for liquid securities, fixing (auction) for illiquid ones.
- The CTO is the opening price that maximises trading, and it may not exist if supply and demand are incompatible.`,
    quiz: [
      {
        q: "On which market are orders public, transparent and visible to everyone in the order book?",
        options: [
          "The block market",
          "The central market",
          "The money market",
          "The over-the-counter market",
        ],
        answer: 1,
        explanation:
          "The central market is the public square where standard-sized orders are visible to all participants.",
      },
      {
        q: "What does the acronym TMB stand for in the context of the block market?",
        options: [
          "Monthly Stock-Market Tax",
          "Marginal Base Rate",
          "Minimum Block Size (Taille Minimum de Blocs)",
          "Moroccan Stock-Market Security",
        ],
        answer: 2,
        explanation:
          "The TMB is the Taille Minimum de Blocs (Minimum Block Size), the size threshold set by the exchange above which a transaction goes through the block market.",
      },
      {
        q: "Why do very large transactions not go through the central market?",
        options: [
          "To avoid disturbing public prices and creating strong volatility",
          "Because those shares are not listed in Casablanca",
          "Because the fixing algorithm systematically rejects them",
          "Because retail investors are banned from it",
        ],
        answer: 0,
        explanation:
          "A massive buy order in one go on the central market would send the price soaring, and the block market avoids that volatility.",
      },
      {
        q: "What is the usual variation limit for a share on the central market during a trading session?",
        options: ["± 1%", "± 35%", "There is no limit", "± 10%"],
        answer: 3,
        explanation:
          "On the central market, the price can only vary by ± 10% relative to the previous day's price.",
      },
      {
        q: "Relative to which price is this ± 10% threshold calculated?",
        options: [
          "The share's price when it was created",
          "The previous day's price, called the reference price",
          "The average price over the last twelve months",
          "The lowest price of the year",
        ],
        answer: 1,
        explanation:
          "The trading corridor is calculated from the previous day's price, which serves as the reference price.",
      },
      {
        q: "What happens to an order placed at a price outside the trading corridor?",
        options: [
          "It can remain in the order book and only be executed if the price comes back within the range",
          "It is automatically transferred to the block market to be executed",
          "It is executed immediately at the upper or lower threshold",
          "It triggers a suspension of trading in the security concerned",
        ],
        answer: 0,
        explanation:
          "Such an order stays in the order book, where it keeps time priority, but it is only executed when the price comes back within the permitted range.",
      },
      {
        q: "If there is no compatibility between buyers and sellers before the opening, what happens?",
        options: [
          "The session price is drawn at random by the algorithm",
          "The State buys the remaining shares",
          "There is no transaction and the CTO does not exist for that session",
          "The share price is automatically halved",
        ],
        answer: 2,
        explanation:
          "If the bid and ask prices never cross, no transaction takes place and the Theoretical Opening Price does not exist for the session.",
      },
      {
        q: "Which securities is continuous trading reserved for?",
        options: [
          "Illiquid, low-demand shares",
          "Only over-the-counter transactions",
          "Securities listed exclusively in the morning",
          "Liquid shares, i.e. those in high demand",
        ],
        answer: 3,
        explanation:
          "Continuous trading is reserved for liquid shares, whose prices fluctuate and trade in real time all day long.",
      },
      {
        q: "What is special about the fixing (auction) system?",
        options: [
          "It sets a new price every five minutes",
          "It accumulates orders for a single matching and one single price per session",
          "It is reserved for currency trades",
          "It removes all price-variation limits",
        ],
        answer: 1,
        explanation:
          "In a fixing, the exchange accumulates orders and then holds a single matching that sets one price for the session.",
      },
      {
        q: "What is the main goal of the algorithm that calculates the Theoretical Opening Price?",
        options: [
          "Maximising the quantity of shares traded",
          "Selling shares at the highest possible price",
          "Favouring sellers over buyers",
          "Protecting majority shareholders",
        ],
        answer: 0,
        explanation:
          "The algorithm looks for the price that allows the largest possible quantity of shares to be executed.",
      },
    ],
  },
  "marche-de-la-dette-obligations": {
    title: "The debt market (Bonds)",
    summary:
      "Understand how a bond's price is formed, and measure the risk premium, the accrued coupon, the real rate and redemption.",
    content: `## Why a bond's price moves

Unlike shares, whose price depends directly on the company's performance, the price of a **bond** depends on interest rates.

Imagine you buy a bond that pays 3% and market rates suddenly rise to 5%. Your security becomes much less attractive than the newly issued bonds. To manage to resell it, you will have to lower its price.

Remember this golden rule: when market rates rise, the value of existing fixed-rate bonds falls, and vice versa. It is an inverse mechanism.

## Fixed rate or variable rate

- **Fixed-rate bond**: the interest rate (the **coupon**) is decided in advance and never changes throughout the life of the security. This is the type of bond that takes the full brunt of the inverse mechanism described above.

- **Variable-rate bond**: here, the interest rate adjusts regularly in line with the market (such as the central bank's policy rate). The yield therefore moves with the economy.

## Assessing risk: the risk premium

The financial security considered "risk-free" par excellence is the **Treasury bill**, because the State is assumed to go bankrupt very rarely.

- To assess whether a corporate (private) bond is attractive, you compare its yield with that of a Treasury bill of the same duration (same maturity).

- The yield difference between the two is called the **risk premium**, or **credit spread**. It is the extra compensation you demand for accepting the risk of lending to a company rather than to the State.

- In finance, this premium is measured in **basis points (bps)**, where 100 basis points equal 1%. For example, if the State offers 3% and the company 5%, the risk premium is 200 bps, i.e. 2%.

- In times of economic uncertainty, risk premiums generally widen, because investors demand higher compensation for accepting risk.

## Reselling early: the accrued coupon

What happens if you resell your bond in the middle of the year, before the anniversary date of the coupon payment? Don't worry, you do not lose your interest.

- You then calculate the **accrued coupon** (accrued interest, called the "pied de coupon" in French market jargon). It represents the interest you have accumulated, day after day, since the last payment.

- The buyer of your bond will have to pay you this accrued coupon **on top of** the bond's price.

- The formula is: accrued coupon = par value (N) multiplied by the interest rate (Ti), divided by 365, then multiplied by the number of days elapsed.

## The invisible enemy: inflation

You must not confuse the stated rate with what you actually earn.

- The **nominal rate** (taux facial): this is the theoretical percentage written on the bond when it is issued, for example 5% per year.

- The **real rate**: this is your true gain in purchasing power. You calculate it simply by subtracting inflation from the nominal rate. If inflation is 2%, your 5% bond really only earns you 3%.

## How do you get your capital back? Redemption (amortisation)

The issuer has several ways of repaying your money, i.e. the capital.

- **Bullet repayment (in fine)**: the company pays you only the interest each year, and repays the entire capital in one go, right at the end.

- **Equal annual instalments**: each year, the company pays you your interest plus a small part of your capital. For the issuer, the advantage is avoiding having to pay out a huge sum all at once at maturity: it smooths out its cash flow.

- **Perpetual**: the bond has no end date. The company never repays the capital, but pays you interest indefinitely.

## Key takeaways

- The price of a fixed-rate bond moves in the opposite direction to market rates.
- The risk premium is measured in basis points, and 100 bps equal 1%.
- The accrued coupon guarantees you the accumulated interest even if you resell before the payment date.
- Only the real rate, after inflation, measures your true gain.
- The redemption method determines when and how you get your capital back.`,
    quiz: [
      {
        q: "For a fixed-rate bond, what happens if market interest rates rise sharply?",
        options: [
          "Its market value mechanically increases",
          "Its market value falls",
          "Its own rate automatically adjusts upwards",
          "It is cancelled by the issuer",
        ],
        answer: 1,
        explanation:
          "When market rates rise, existing fixed-rate bonds pay less than new ones, and their price must fall for them to be resold.",
      },
      {
        q: "What characterises a variable-rate bond?",
        options: [
          "Its interest rate adjusts regularly in line with the market",
          "Its interest rate is set once and for all at issuance",
          "It never pays interest to its holder",
          "It must be issued by the State",
        ],
        answer: 0,
        explanation:
          "A variable-rate bond's rate adjusts regularly in line with the market, such as the central bank's policy rate, so its yield moves with the economy.",
      },
      {
        q: 'Which security serves as the "risk-free" benchmark for assessing a bond?',
        options: [
          "The share of a very large listed company",
          "A perpetual bond issued by a bank",
          "The Treasury bill",
          "The accrued coupon of a private bond",
        ],
        answer: 2,
        explanation:
          "The Treasury bill is considered the risk-free security par excellence, because the State is assumed to go bankrupt very rarely.",
      },
      {
        q: "What does a gap of 100 basis points (bps) correspond to?",
        options: ["0.01%", "0.1%", "10%", "1%"],
        answer: 3,
        explanation: "In finance, 100 basis points correspond exactly to 1%.",
      },
      {
        q: "If a Treasury bill offers 3% and a corporate bond 5%, what is the risk premium?",
        options: [
          "2 basis points, a gap considered negligible",
          "200 basis points",
          "500 basis points",
          "There is no risk premium in this case",
        ],
        answer: 1,
        explanation:
          "The risk premium is the yield difference, i.e. 2%, which corresponds to 200 basis points.",
      },
      {
        q: "In times of economic uncertainty, how do risk premiums generally move?",
        options: [
          "They disappear entirely from the bond market",
          "They fall, because investors are reassured by the situation",
          "They widen (increase)",
          "They stay strictly identical no matter what",
        ],
        answer: 2,
        explanation:
          "Risk premiums widen in times of uncertainty, because investors demand higher compensation for accepting risk.",
      },
      {
        q: "When a bond is sold between two payment dates, who pays the accrued coupon and to whom?",
        options: [
          "The issuing company pays it directly to the buyer of the security",
          "No one: the accumulated interest is simply lost",
          "The seller pays it to the buyer on top of the security transfer",
          "The buyer pays it to the seller",
        ],
        answer: 3,
        explanation:
          "The buyer pays the accrued coupon to the seller, on top of the bond's price, to give them back the interest accumulated since the last payment.",
      },
      {
        q: "A bond shows a nominal rate of 5% and inflation is 2%. What is the real rate?",
        options: ["3%", "7%", "2.5%", "10%"],
        answer: 0,
        explanation:
          "The real rate is obtained by subtracting inflation from the nominal rate, i.e. 5% minus 2%, so 3%.",
      },
      {
        q: 'What is "bullet" (in fine) redemption?',
        options: [
          "The company repays part of the capital each year with the interest",
          "The company pays the interest each year and repays all the capital in one go at the end",
          "The company never repays the capital but pays interest indefinitely",
          "The company repays the capital first and the interest afterwards",
        ],
        answer: 1,
        explanation:
          "With bullet (in fine) redemption, only the interest is paid each year and the entire capital is repaid in one go at maturity.",
      },
      {
        q: "What is the advantage of equal annual instalments for the issuing company?",
        options: [
          "It no longer has any interest to pay to its creditors",
          "It can freely convert its bonds into listed shares",
          "It smooths its cash flow and avoids paying out a huge sum all at once at the end",
          "It automatically increases the par value of its bond",
        ],
        answer: 2,
        explanation:
          "By repaying a small part of the capital each year, the company avoids having to pay out a very large sum all at once at maturity.",
      },
    ],
  },
  "passer-a-l-action-avec-le-carnet-d-ordres": {
    title: "Taking action with the order book",
    summary:
      "Read an order book, understand price and time priority, and choose between a limit order, a market order, EoE and EeE.",
    content: `## The order book: the Addoha (ADH) example

To buy or sell on the stock market, your orders appear in an **order book**, i.e. the **central market**. Let's take the example of the Addoha share (ADH):

- On the left, in green: **Demand** (the bids). These are the buyers. The best buyer right now wants 50 shares at a maximum price of 36.01 MAD.

- On the right, in red: **Supply** (the asks). These are the sellers. The most competitive seller offers to sell at 37.48 MAD.

- The **N°** column tells you how many people have placed an order at that exact price. Facing the price of 37.48 MAD, the "4" means there are 4 different sell orders, adding up to a total quantity of 5,870 shares.

Why is nothing happening? Because the market is at a standstill: the best buyer refuses to pay more than 36.01 MAD, and the best seller refuses to go below 37.48 MAD. As long as nobody moves, no transaction takes place.

## The law of the (organised) jungle: the two priorities

But why is the buyer at 36.01 MAD at the very top of the green list? The Exchange obeys two golden rules.

- **Price priority** (Priorité Prime): this is rule number one. The buyer offering the highest price (36.01 MAD) goes ahead of the one offering 35.60 MAD. On the sellers' side, the one who sells at the lowest price (37.48 MAD) goes ahead of the one demanding 37.70 MAD.

- **Time priority**: it separates those showing the same price. The 4 sellers all offering 37.48 MAD are ranked on a "first come, first served" basis.

Remember the order: price first, time second.

## Limit order or market order?

When you place an order, you have two main strategies.

- The **limit order**: you set a ceiling (when buying) or a floor (when selling). If you place a buy order limited at 36.50 MAD, you instantly take first place in the green queue, ahead of the buyer at 36.01 MAD. Advantage: you control your budget. Drawback: you still have to wait for a seller to agree to come down to 36.50 MAD, and your order may never be executed.

- The **market order**: you want to buy right away, whatever the price. If you fire off a market buy order for 100 shares, the system picks directly from the best available red offer: you will therefore pay 37.48 MAD. Advantage: immediate execution. Drawback: no control over the execution price.

## Who really sets the execution price?

Imagine a seller in a real hurry who arrives on this Addoha order book and announces: "I'm selling 50 shares, and I'm willing to go as low as 35.00 MAD!" At what price will the transaction happen? At 35.00 MAD? At 36.01 MAD?

- The transaction will be executed at **36.01 MAD**.

- Why? Because the rule says the execution price is always that of the order that was already in the order book first. The buyer at 36.01 MAD was waiting patiently: their price is respected.

- The result: the new seller is delighted. They were ready to sell off cheap at 35.00 MAD, and they walk away with 36.01 MAD. Once fully executed, their order disappears from the book.

## The extreme conditions: EoE and EeE

If you trade large volumes, you can add a special validity to your order.

- **EoE (Exécuter ou Éliminer — execute or eliminate, the Moroccan equivalent of "fill or kill")**: it is all or nothing. If you want to buy 10,000 shares at 37.48 MAD but only 5,870 are available, the order is totally cancelled: you buy nothing.

- **EeE (Exécuter et Éliminer — execute and eliminate, similar to "immediate or cancel")**: you are more flexible. You buy the 5,870 shares immediately, and the **remainder**, i.e. the missing 4,130 shares, is cancelled and removed from the system instead of staying on hold.

## Key takeaways

- The order book shows demand (buyers) on the left and supply (sellers) on the right, with the number of orders grouped at each price.

- Price priority always trumps time priority.

- A limit order protects your price but does not guarantee execution; a market order guarantees execution but not the price.

- The price used is that of the order already present in the book.

- EoE cancels everything if the full quantity is not available; EeE executes what is possible and eliminates the remainder.`,
    quiz: [
      {
        q: "In the Addoha (ADH) order book, what price is offered by the best buyer?",
        options: ["37.48 MAD", "36.01 MAD", "35.60 MAD", "37.70 MAD"],
        answer: 1,
        explanation:
          "The best buyer in the green queue wants 50 shares at a maximum price of 36.01 MAD.",
      },
      {
        q: 'What does the "4" in the N° column on the sellers\' line at 37.48 MAD mean?',
        options: [
          "That there are 4 shares available at this price",
          "That the share has risen by 4%",
          "That there are 4 distinct sell orders grouped at this price",
          "That the offer stays valid for 4 days",
        ],
        answer: 2,
        explanation:
          "The N° column shows the number of orders placed at that price — here 4 orders totalling 5,870 shares.",
      },
      {
        q: "Why is the buyer at 36.01 MAD placed ahead of the buyer at 35.60 MAD?",
        options: [
          "By price priority: they offer to pay more",
          "By time priority: they arrived earlier",
          "Because they are asking for a smaller quantity",
          "Because their order is a market order",
        ],
        answer: 0,
        explanation: "Price priority puts the buyer offering the highest price at the front.",
      },
      {
        q: "A fifth seller also offers 37.48 MAD. Where are they placed among the sellers at that price?",
        options: [
          "In first position",
          "Last, according to time priority",
          "Their order is rejected",
          "Ahead of all the buyers",
        ],
        answer: 1,
        explanation:
          'At an equal price, time priority applies "first come, first served", so the last to arrive goes last.',
      },
      {
        q: "You place a market buy order for 50 shares on this Addoha order book. What happens?",
        options: [
          "The order waits indefinitely in the book",
          "You buy 50 shares at 36.01 MAD",
          "You buy 50 shares at 35.60 MAD",
          "You buy 50 shares immediately at 37.48 MAD",
        ],
        answer: 3,
        explanation:
          "A market order picks from the best available red offer, i.e. 37.48 MAD, with immediate execution.",
      },
      {
        q: "What is the main drawback of a limit order?",
        options: [
          "Paying much more than planned",
          "Being forced to buy at the market price",
          "Never being executed if the market does not reach your price",
          "Automatically losing price priority",
        ],
        answer: 2,
        explanation:
          "With a limit order you control your budget, but you must wait for a counterparty to accept your price, which may never happen.",
      },
      {
        q: "A seller in a hurry announces they are selling 50 shares and are willing to go as low as 35.00 MAD. At what price is the transaction done with the best buyer?",
        options: [
          "36.01 MAD",
          "35.00 MAD",
          "35.50 MAD, the average of the two prices",
          "No transaction is possible",
        ],
        answer: 0,
        explanation:
          "The execution happens at 36.01 MAD, the price of the buyer already present in the book.",
      },
      {
        q: "Why does this execution happen at 36.01 MAD and not at the price announced by the seller?",
        options: [
          "Because the Exchange always keeps the highest price in the book",
          "Because the AMMC sets that price in the morning",
          "Because the seller is penalised for their haste",
          "Because the price used is that of the order already present in the book first",
        ],
        answer: 3,
        explanation:
          "The rule says the execution price is that of the order already waiting in the book — here the buyer at 36.01 MAD.",
      },
      {
        q: "You place an EoE buy order for 10,000 shares at 37.48 MAD, but only 5,870 are available. What happens?",
        options: [
          "You buy 5,870 shares and wait for the rest",
          "You pay more to obtain the remainder",
          "The order is totally cancelled and you buy nothing",
          "The order stays in the book until the next day",
        ],
        answer: 2,
        explanation:
          'EoE means "execute or eliminate": it is all or nothing, so the order is cancelled in full.',
      },
      {
        q: "In the same situation, how does an EeE order behave?",
        options: [
          "You buy the 5,870 shares and the remainder of 4,130 shares is cancelled",
          "The order is frozen for a week",
          "The order removes the other buyers from the book",
          "The order is refused by the system",
        ],
        answer: 0,
        explanation:
          'EeE means "execute and eliminate": the available part is bought and the remainder is removed from the system.',
      },
    ],
  },
  "fixer-le-prix-d-une-introduction": {
    title: "Setting the price of an IPO",
    summary:
      "Understand how the price of a stock market listing is set (fixed-price offer OPF, open-price offer OPO, minimum-price offer OPM, direct listing) and how the securities are allocated.",
    content: `## The first-day challenge

When a company enters the stock market, it sells its new shares to the public on the **primary market**. This is the moment when **supply** (the shares the company wants to sell) meets **demand** (the investors who want to buy).

This crucial step has a precise name: the **first listing procedure** (procédure de première cotation). One formidable question remains: at what price should these shares be sold? The company has several methods.

## The fixed-price offer (Offre à Prix Ferme, OPF)

This is the most direct method, and the most frequent.

- The principle: the share price is determined in advance by the company and does not change at all during the whole subscription period.
- The example: for its IPO, the company **Akdital** offered its shares at a fixed price of **670 MAD**. Everyone who wanted to buy knew exactly what they were going to pay.

With an OPF, there are no surprises on the price: you know from the start how much a share costs.

## The open-price offer (Offre à Prix Ouvert, OPO)

Sometimes the company is not sure of the exact price investors are willing to pay. It then uses an OPO.

- The principle: the company does not give a fixed price, but a **price range** (for example, between 210 MAD and 240 MAD).
- Investors make their bids inside this range, respecting a **price step** (pas de cotation), i.e. the increment by which you can bid. If the step is 5 MAD, you can offer 210 MAD, 215 MAD or 220 MAD, but not 212 MAD.
- At the end, all the bids are matched to find an **equilibrium price**. All the selected investors will ultimately pay this same equilibrium price, whatever price they had offered.

## The big problem: when demand exceeds supply

What happens if the company puts 1 million shares up for sale, but the public asks for 5 million? Not everyone can be satisfied.

The company must then carry out an **allocation of securities**, i.e. divide the cake among the subscribers. There are two main methods.

## Pro-rata allocation

You apply a simple percentage. The formula is:

- Shares received = (Total supply / Total demand) × Shares subscribed by the person.

Concretely, if demand is 5 times greater than supply, each investor will receive only **20%** of what they asked for. The stronger the demand, the smaller everyone's share.

## Iterative allocation

This is a more "social" algorithm.

- Subscribers are ranked, then shares are handed out one by one, in allocation rounds, until the stock runs out.
- The result: this method gives **small investors** a better chance of getting shares. The fewer shares you ask for, the more likely you are to receive your entire order.

## The rarer methods: OPM and direct listing

- The **minimum-price offer (Offre à Prix Minimum, OPM)**: the company sets only a floor price, the absolute minimum below which it refuses to sell. In Morocco, to prevent the price from soaring too high — which would kill the share's liquidity after the listing — the Exchange often imposes a cap, generally set at **+ 20%** of the minimum price.
- **Direct listing**: if a company is already listed on a foreign exchange, its securities are already widely held by the public. It can therefore join the Bourse de Casablanca directly on the **secondary market**, without going through the "issuing new securities" stage.

## A practical reflex

You might be tempted to subscribe through several different **brokerage firms** to multiply your chances during an IPO. Bad idea: the chances are the same everywhere, subscribing several times is forbidden, and your subscription would simply be rejected.

## Key takeaways

- The first listing procedure organises the meeting of supply and demand on the primary market.
- OPF: fixed price known in advance. OPO: price range, price step, then a single equilibrium price for everyone.
- When demand exceeds supply: pro-rata allocation (percentage) or iterative allocation (distribution in rounds, favourable to small holders).
- OPM: floor price, with a cap often set at + 20% in Morocco. Direct listing: reserved for securities already widely held by the public.`,
    quiz: [
      {
        q: "What is the step where supply meets demand called when a company goes public?",
        options: [
          "The transfer of securities to the block market",
          "The first listing procedure",
          "The capital increase reserved for employees",
          "The purge of the order book",
        ],
        answer: 1,
        explanation:
          "The lesson explicitly names this step the first listing procedure (procédure de première cotation).",
      },
      {
        q: "What does the acronym OPF stand for?",
        options: [
          "Offre à Prix Ferme (fixed-price offer)",
          "Floating Public Offer",
          "Fixed-Price Bond",
          "Financial Sharing Option",
        ],
        answer: 0,
        explanation:
          "OPF is short for Offre à Prix Ferme (fixed-price offer), the most direct and most frequent method.",
      },
      {
        q: "At what fixed price did the company Akdital offer its shares during its IPO?",
        options: ["210 MAD", "240 MAD", "225 MAD", "670 MAD"],
        answer: 3,
        explanation:
          "The lesson states that Akdital offered its shares at a fixed price of 670 MAD.",
      },
      {
        q: "In an OPO with a range of 210 MAD to 240 MAD and a price step of 5 MAD, which bid is impossible?",
        options: ["215 MAD", "220 MAD", "212 MAD", "210 MAD"],
        answer: 2,
        explanation:
          "With a step of 5 MAD, only increments such as 210, 215 or 220 MAD are accepted, so 212 MAD is impossible.",
      },
      {
        q: "At the close of an OPO, what price do the selected subscribers pay?",
        options: [
          "Each pays exactly the price they offered",
          "They all pay the same equilibrium price",
          "Each pays the maximum price of the range",
          "Each pays the floor price of the range",
        ],
        answer: 1,
        explanation:
          "After the bids are matched, an equilibrium price is found and all selected investors pay that same price.",
      },
      {
        q: "If demand is 5 times greater than supply and allocation is pro rata, what share of their request does an investor receive?",
        options: ["20%", "50%", "5%", "100%"],
        answer: 0,
        explanation:
          "The lesson specifies that with demand 5 times greater than supply, each investor receives only 20% of what they asked for.",
      },
      {
        q: "What is the formula for pro-rata allocation?",
        options: [
          "Total demand divided by total supply",
          "Number of shares requested divided by the share price",
          "Total supply minus the demand of institutional investors",
          "(Total supply / Total demand) × shares subscribed by the person",
        ],
        answer: 3,
        explanation:
          "The formula given is Shares received = (Total supply / Total demand) × Shares subscribed.",
      },
      {
        q: "What is the advantage of iterative allocation?",
        options: [
          "It guarantees a dividend payment from the first year",
          "It lets the biggest buyers be served first",
          "It gives small investors a better chance of getting shares",
          "It reduces the price paid for each allotted share",
        ],
        answer: 2,
        explanation:
          "By handing out securities one by one in rounds, iteration favours small investors, who are more likely to receive their entire order.",
      },
      {
        q: "Why does the Exchange often impose a cap of + 20% of the minimum price in an OPM in Morocco?",
        options: [
          "Because international banks demand it",
          "To prevent the price from soaring too high and killing the share's liquidity",
          "To guarantee subscribers a high risk premium",
          "To stop the company from going bankrupt after the IPO",
        ],
        answer: 1,
        explanation:
          "The cap avoids issuing at too high a price, which would destroy the share's liquidity after the listing.",
      },
      {
        q: "In which case can a company do a direct listing on the Bourse de Casablanca?",
        options: [
          "When its securities are already widely held by the public, for example because it is listed on a foreign exchange",
          "When it was created less than a year ago",
          "When it has no minority shareholders",
          "When the State has just bought it out",
        ],
        answer: 0,
        explanation:
          "Direct listing is reserved for companies whose securities are already widely held by the public, such as those already listed abroad, which then join the secondary market directly.",
      },
    ],
  },
  "les-batailles-pour-le-controle-offres-publiques": {
    title: "Battles for control (Public Offers)",
    summary:
      "Understand public offers in Morocco: the voluntary takeover bid, the hostile takeover bid, the mandatory takeover bid and the OPR, with their thresholds and rules.",
    content: `## Taking control of a listed company

The public offering (appel public à l'épargne) is not the only major operation in a company's life. Sometimes an investor or a competing company wants to **take control** of a company. For that, a **takeover bid (Offre Publique d'Achat, OPA)** is used.

- The principle: it is an operation that targets **only the shares of companies that are already listed**.
- The offer's initiator publicly proposes to buy the other shareholders' shares.
- They offer a price **generally higher than the market price**, to encourage them to sell.

Remember this point well: no listing, no public offer. An unlisted company is bought through private negotiations, not through a takeover bid.

## The voluntary takeover bid: the acquisition strategy

A takeover bid can be **voluntary**, i.e. launched on a buyer's initiative to achieve a strategic control objective.

- The **cancellation threshold** (seuil de renonciation): the buyer sets a precise target, for example obtaining at least 30% of the shares. If, at the end of the operation, they have not collected this minimum percentage, the takeover bid is simply cancelled.
- In other words, the buyer does not want to end up with a stake too small to give them any power: they would rather walk away.

The **hostile takeover bid**: if a competitor wants to buy these shares without having reached a prior agreement with the target company's majority shareholders, it is called a hostile takeover bid. The offer then goes over the heads of the executives and addresses the shareholders directly.

A note on the Moroccan market: the voluntary takeover bid is **very rare in Morocco**, because companies' capital there is not very fragmented. Often, a reference shareholder already owns the vast majority of the shares. Buying up the **free float** (the part of the shares that circulates freely on the market) is then not enough to take control.

## The mandatory takeover bid: protecting minority shareholders

The law imposes strict rules to protect small shareholders.

- The **crossing threshold**: if an investor buys shares on the market and exceeds **40% ownership** of a company on the **main market**, they are obliged to launch a takeover bid for the remaining shares.
- On the **alternative market**, this threshold is **50%**.

Why this obligation? Because at this level of ownership, the decision-making power and the **sovereignty** of the company change radically. It is no longer the same company: it comes under the direction of a new, strong shareholder. The law therefore obliges the latter to offer to buy back the minority shareholders' shares, should they not wish to remain under their direction.

An essential difference from the voluntary takeover bid: in a mandatory takeover bid, there is **no cancellation threshold**. The initiator is obliged to buy **all the shares** tendered to them, without being able to cancel the operation because they do not like the outcome.

## The public delisting offer (Offre Publique de Retrait, OPR): the exit door

There is another mandatory offer, called the **OPR**, i.e. the **Offre Publique de Retrait (public delisting offer)**. It occurs in two precise cases:

- If a shareholder becomes so powerful that they cross **95% of the voting rights**.
- Or if the company is **delisted from the exchange**, i.e. it leaves the market.

The objective is to **protect liquidity**. If a share leaves the stock market, or if only 5% of the shares remain in circulation, it becomes almost impossible to resell it: there is no one left on the other side to buy. The main shareholder is therefore obliged to offer an exit door, an OPR, to buy back the last remaining shares.

## What to remember

- The takeover bid only concerns listed companies, at a price generally above the market price.
- Voluntary: the buyer sets a cancellation threshold and can cancel if it is not reached. It is hostile if there was no prior agreement with the majority shareholders.
- Mandatory: triggered when 40% is crossed on the main market and 50% on the alternative market, with no possibility of backing out.
- OPR: triggered when 95% of the voting rights is crossed or in the event of delisting, to offer an exit to the last shareholders.`,
    quiz: [
      {
        q: "What is a takeover bid (Offre Publique d'Achat, OPA)?",
        options: [
          "An offer by the State to privatise a public service",
          "A public proposal to acquire the shares of a listed company, often at an attractive price",
          "A free distribution of shares to deserving employees",
          "A redundancy plan publicly announced by a company",
        ],
        answer: 1,
        explanation:
          "A takeover bid is an operation by which an initiator publicly proposes to buy back the shares of the other shareholders of a listed company.",
      },
      {
        q: "What type of companies does a public offer target?",
        options: [
          "Non-profit associations",
          "Sole traders and small family businesses",
          "Only companies already listed on the stock market",
          "All companies, listed or unlisted",
        ],
        answer: 2,
        explanation:
          "The lesson specifies that the operation targets only the shares of companies that are already listed.",
      },
      {
        q: "What price does the initiator of a takeover bid generally offer to encourage shareholders to sell?",
        options: [
          "A price higher than the market price",
          "A price strictly identical to the day's market price",
          "A price below the market, to get a bargain at the minorities' expense",
          "Payment in kind, in the form of company assets",
        ],
        answer: 0,
        explanation:
          "The initiator offers a price generally higher than the market price to encourage shareholders to sell them their securities.",
      },
      {
        q: "In a voluntary takeover bid, what happens if the cancellation threshold is not reached?",
        options: [
          "The initiator must still buy all the shares tendered",
          "The AMMC sets a new buyout price itself",
          "The threshold is automatically halved",
          "The takeover bid is simply cancelled",
        ],
        answer: 3,
        explanation:
          "The cancellation threshold is the minimum target set by the buyer: if they do not collect it, the takeover bid fails and is cancelled.",
      },
      {
        q: "What is a takeover bid launched without a prior agreement with the target company's majority shareholders called?",
        options: [
          "A friendly takeover bid",
          "A mandatory takeover bid",
          "A hostile takeover bid",
          "A public delisting offer (OPR)",
        ],
        answer: 2,
        explanation:
          "A takeover bid conducted without a prior agreement with the target's majority shareholders is described as hostile.",
      },
      {
        q: "Why are voluntary takeover bids very rare in Morocco?",
        options: [
          "Because companies' capital there is not very fragmented",
          "Because Moroccan law flatly prohibits this type of operation on the main market",
          "Because Moroccan listed companies do not pay enough dividends to interest a buyer",
          "Because only companies delisted from the exchange can be the subject of an offer",
        ],
        answer: 0,
        explanation:
          "A reference shareholder often already holds the vast majority of the shares, so buying up the free float is not enough to take control.",
      },
      {
        q: "Which ownership threshold, once crossed on the main market, obliges an investor to launch a takeover bid?",
        options: ["20%", "30%", "33%", "40%"],
        answer: 3,
        explanation:
          "On the main market, crossing 40% ownership triggers the obligation to launch a takeover bid for the remaining shares.",
      },
      {
        q: "What is the crossing threshold that triggers a mandatory takeover bid on the alternative market?",
        options: ["40%", "50%", "66%", "95%"],
        answer: 1,
        explanation:
          "The lesson sets this threshold at 50% for the alternative market, versus 40% for the main market.",
      },
      {
        q: "In the case of a mandatory takeover bid, is there a cancellation threshold?",
        options: [
          "Yes, the law sets it at 30% of the shares targeted",
          "Yes, but only if the initiator requests it before the operation",
          "No, the initiator must buy all the shares tendered to them",
          "No, but the initiator may buy only half of the securities tendered",
        ],
        answer: 2,
        explanation:
          "Unlike a voluntary takeover bid, a mandatory takeover bid has no cancellation threshold: the initiator must buy all the securities tendered.",
      },
      {
        q: "What are the two cases that trigger a public delisting offer (Offre Publique de Retrait, OPR)?",
        options: [
          "Crossing 95% of the voting rights or delisting from the exchange",
          "Crossing 40% of the capital or the payment of an exceptional dividend",
          "Launching a hostile takeover bid or appointing a new CEO",
          "Crossing 50% of the voting rights or a capital increase",
        ],
        answer: 0,
        explanation:
          "The OPR applies when a shareholder crosses 95% of the voting rights or when the company is delisted from the exchange, in order to protect the liquidity of the last shareholders.",
      },
    ],
  },
  "la-vie-de-l-action-les-operations-sur-titres": {
    title: "The life of a share: corporate actions",
    summary:
      "Understand corporate actions, the ex-dividend and entitlement dates, and the price adjustment after a dividend.",
    content: `## What a corporate action (Opération Sur Titre, OST) is

Once a share has been created and is trading on the market, its life is not a long, quiet river. The company can make decisions that directly impact the shares it has issued. This is called a **corporate action (Opération Sur Titre, OST)**.

In other words: you hold a security, and the issuer of that security acts in a way that changes what you have in your securities account. There are two main families of corporate actions.

## The two families: mandatory and optional

- **Mandatory corporate actions** are automatic. You have nothing to do, no authorisation to give: the operation is executed automatically on your account simply because you hold the security. The best-known example is the **payment of dividends**.

- **Optional corporate actions** require an instruction from you. The company offers you a choice, and it is up to you to decide. Example: taking part in a **cash capital increase** by using your **subscription rights**.

The distinction is simple to remember: mandatory, you undergo it (or benefit from it) without lifting a finger; optional, you must give your answer, otherwise you miss out on the choice.

## Dividend payment: the key dates

When a company distributes part of its profits (dividends), the mechanics follow a very precise calendar. Two dates really matter.

- The **ex-dividend date** (date de détachement): this is the deadline. It is the precise day on which the share starts trading on the market WITHOUT the right to the announced dividend. If you own the share before this date, you will receive the dividend. If you buy it on or after this date, you will get nothing for this period. It is a date that repeats every year.

- The **entitlement date** (date de jouissance): this is the date from which a share starts giving the right to economic benefits, such as dividends. It is often used when the company issues new shares, for example during a capital increase.

## Why use an entitlement date

Imagine a company creates new shares on July 1, with an entitlement date set at January 1 of the following year. The consequence: the new shareholders will not be entitled to the current year's dividends.

- The goal? To protect the existing shareholders, those who supported the company all year long, and to guarantee fairness according to each person's period of participation.

- Once this date has passed, the rights of existing and new shareholders become strictly identical. There are no longer two categories of shareholders: everyone is in the same boat.

## The dividend's impact on the share price

Many beginners think they can buy a share the day before the dividend ex-date, collect the money the next day, then resell the share at the same price. That is wrong, and here is why.

- On the ex-dividend date, the **Bourse de Casablanca** automatically adjusts the share's value downwards.

- The share price falls by an amount exactly equal to the value of the dividend paid.

- A concrete example: the share sells for 50 MAD. The company detaches a dividend of 5 MAD per share. On the morning of the ex-date, the Bourse de Casablanca makes sure the share automatically opens at 45 MAD.

This is why we speak of an **adjusted price**: the share's reference price is corrected by the Exchange to take into account the money that has left the company's coffers. The total value of your wealth does not mechanically change on the ex-date: part of it was in the share price, and it is now sitting as cash in your account.

## What to remember

- A corporate action is a company decision that affects the securities it has issued.

- Mandatory corporate action: automatic, like a dividend. Optional corporate action: you must give an instruction, like exercising subscription rights.

- Ex-dividend date: from this day on, the share trades without the announced dividend; it comes around every year.

- Entitlement date: from this day on, a new share gives the right to economic benefits, and all shareholders' rights align.

- On the ex-date, the price is adjusted downwards by the exact amount of the dividend: there is no free money to collect the day before.`,
    quiz: [
      {
        q: "What is a corporate action (Opération Sur Titre, OST)?",
        options: [
          "A tax levied by the AMMC on every stock-market transaction",
          "A decision by the company that affects the securities it has issued",
          "A simple transfer of money between two Moroccan banks",
          "The printing of shares on paper for shareholders",
        ],
        answer: 1,
        explanation:
          "A corporate action is a decision taken by the issuing company that directly impacts the shares already in circulation.",
      },
      {
        q: 'What characterises a "mandatory" corporate action?',
        options: [
          "It is executed automatically on your account, without any instruction from you",
          "It requires you to send a choice to your brokerage firm",
          "It only concerns companies not listed on the stock market",
          "It must be signed before a notary before being executed",
        ],
        answer: 0,
        explanation:
          "A mandatory corporate action is executed automatically simply because you hold the security, with no authorisation to give.",
      },
      {
        q: "Which of these examples is a mandatory corporate action?",
        options: [
          "Subscribing to a cash capital increase",
          "Using your subscription rights",
          "The payment of dividends",
          "Signing a management mandate with your bank",
        ],
        answer: 2,
        explanation:
          "The payment of dividends is the best-known example of a mandatory corporate action, because it happens automatically.",
      },
      {
        q: "Which example of an optional corporate action does the lesson give?",
        options: [
          "The automatic detachment of the annual dividend",
          "The price adjustment carried out by the Bourse de Casablanca",
          "Setting the entitlement date of new shares",
          "Taking part in a cash capital increase with your subscription rights",
        ],
        answer: 3,
        explanation:
          "Taking part in a cash capital increase via your subscription rights requires an instruction from the investor, so it is an optional corporate action.",
      },
      {
        q: 'What does the "ex-dividend date" (date de détachement) refer to?',
        options: [
          "The day the company announces its annual profits to the market",
          "The day the share starts trading without the right to the announced dividend",
          "The day of the share's legal creation",
          "The day the company is delisted",
        ],
        answer: 1,
        explanation:
          "From the ex-dividend date onwards, the share trades on the market without the right to the announced dividend.",
      },
      {
        q: "You buy a share on the very day of its ex-dividend date. What happens?",
        options: [
          "You receive the dividend twice for that period",
          "Your share is frozen for a whole month",
          "You will not receive the dividend for that period",
          "You must pay a penalty to your brokerage firm",
        ],
        answer: 2,
        explanation:
          "Only those who held the share before the ex-dividend date receive the dividend for the period.",
      },
      {
        q: "Which institution mechanically adjusts the share price on the morning of the ex-date?",
        options: [
          "The Bourse de Casablanca",
          "Maroclear, the central depository",
          "The Moroccan government",
          "The commercial banks of the market",
        ],
        answer: 0,
        explanation:
          "It is the Bourse de Casablanca that automatically adjusts the share's value downwards on the ex-dividend date.",
      },
      {
        q: 'What does the "entitlement date" (date de jouissance) refer to?',
        options: [
          "The end-of-life date of the company",
          "The company's annual accounts closing date",
          "The day markets are closed for a holiday",
          "The date from which a share gives the right to economic benefits",
        ],
        answer: 3,
        explanation:
          "The entitlement date is the starting point of the right to economic benefits, such as dividends.",
      },
      {
        q: "A company issues new shares on July 1 with an entitlement date of the following January 1. What happens to the rights once that date has passed?",
        options: [
          "Existing shareholders lose their shares",
          "The rights of existing and new shareholders become strictly identical",
          "New shareholders must buy out the company",
          "The Bourse de Casablanca cancels the capital increase",
        ],
        answer: 1,
        explanation:
          "Once the entitlement date has passed, existing and new shareholders have exactly the same rights.",
      },
      {
        q: "A share trades at 50 MAD and the company detaches a dividend of 5 MAD. At what price does the share open on the morning of the ex-date?",
        options: ["55 MAD", "50 MAD", "45 MAD", "5 MAD"],
        answer: 2,
        explanation:
          "The price is adjusted downwards by an amount exactly equal to the dividend, i.e. 50 MAD minus 5 MAD.",
      },
    ],
  },
};

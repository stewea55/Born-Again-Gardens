flowchart TD

    %% =========================
    %% SHOP FLOW
    %% =========================

    shop["/shop<br/>Links to shop_resources in DB<br/>Merchandise has set prices"]
    cart["/cart<br/>Displays selected items from /shop<br/>Shows quantities + total pricing"]

    shop --> cart
    cart --> payment


    %% =========================
    %% HARVEST FLOW
    %% =========================

    harvest["/harvest<br/>Users add items to basket<br/>Plant catalog displayed here"]
    basket["/basket<br/>Items from harvest page<br/>Variable payment<br/>User selects amount based on harvest total<br/>Recommended payment shown"]

    harvest --> basket
    basket --> payment


    %% =========================
    %% DONATION FLOW
    %% =========================

    donate["/donate<br/>Users donate on behalf of themselves"]

    %% Selected amount goes straight to payment
    donate --> payment


    %% =========================
    %% PAYMENT
    %% =========================

    payment["/payment<br/>Stripe Integrated Payment Page"]


    %% =========================
    %% COMMENTARY
    %% =========================

    %% /donate: selected amount goes to /payment on confirm. "Donating on behalf of a company?" links to /sponsorships (contact only, no Stripe).
    %% /basket allows custom payment amount selection before routing to /payment
    %% /cart routes fixed-price merchandise totals to /payment
    %% Corporate sponsorship: contact only (email, phone on /sponsorships); no payment path on the website.



    There is a /shop page that displays the public.shop_catalog table information. The user will be able to see names of products, information relevant to those products, sizes (if clothing), have an image url that displays the image of that product and a price. For some products, there will be a quantity left displayed. It is important that this /shop page, has a link that takes you to your cart found on /cart. Here you can edit quantities, change sizes, and delete things from your cart. It displays a total based on what is in the cart. The user can click “back to shopping” or “checkout”. Back to shopping takes them back to the /shop page and checkout takes them to the /payment page where the total price that is displayed for the user is then carried over to the payment total. 

there is a /harvest page that there is a lot of copy for in the md file “page.harvest”. The plant catalog found in public.plant_catalog will be displayed here. This page will be built out more later. It won’t be built out for v1 of production, however I want to build out the bones for it now. There is a displayed “basket” that the user can fill up while harvesting. There will be a button that says “view my basket” where they can edit quantities and have a representative price that is linked to the sum of the quantities. The pricing per quantities can be found in public.plant_catalog as well. On this page, I want there to be an editable text box that displays the total amount from the basket. This box, however is a “dirty” state  ( I think?) where the user can edit it and put whatever amount they want. The amount they select when they “confirm” and get sent to /payment is the “final amount”. The DB has to keep track of the recommended payment amount (basket sum) because if the amount that they elect to pay is greater than the “recommended amount”, then it is tracked as a donation. [This is future state but I want to include a popup on the payment page if someone goes through the harvest path, that says “interested in merch?”(or something like that) that takes them to the /shop page to see our merchandise. I say this to say that both basket and cart pages must be kept and stored temporarily for the user like in other shopping websites. Where they can leave them and come back.]

/donate and /sponsorships are both pages that you insert donation amount directly along with various text inserts for name, email, etc. These can be found as columns in the DB. I want to make sure that the DB is working correctly for this part though so its important that we review and work through this for clarity so that we can ensure that data is going to the right place. 
for /donate, down at the sponsorship options section, which already exists, I want there to be recommended amounts of 20,50,100,250 that are displayed as buttons that input that amount into the text field.  There is a “confirm” button that takes you to /payment page but there is also a “donating on behalf of a company? Button that takes them to the top of /sponsorships page. 

the /sponsorships page  in the “sponsorship options” sections there are buttons that are $500, $1500, $3000, $5000. Upon clicking, it auto inputs that amount into the editable text box (restricted to numerics) 
 
For the /cart-> /payment , /basket-> /payment, and the /donate -> /payment paths, I want there to be a popup after they hit confirm that has a “sign in with google” “continue as guest” popup. This popup can be closed but it is the restrictor to getting to the /payment page if they elect to close the popup, they remain on the respective page that they were on. They cannot pass through to payment without selecting either sign in with google where a successful sign in takes them to /payment page, or continue as guest takes them to /payment page. The sign in with google is the google oauth, and continue as guest gives them a form to fill out on the /payment page. These form fields are the relevant column headers found in “public.guest” for now “email” and “full name”. If stripe already does this, then I don’t want to duplicate it I just want to capture and store it for my DB. 

There is no /sponsorships -> /payment path; sponsor tables are display-only and updated manually. 

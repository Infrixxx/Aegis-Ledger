//+------------------------------------------------------------------+
//|                                              AccountGuardian.mq5 |
//|                                                   Code Whisperer |
//+------------------------------------------------------------------+
#property copyright "Code Whisperer"
#property link      ""
#property version   "1.00"

input string ApiUrl = "http://localhost:3000/api/telemetry/trade-event";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    Print("Aegis Ledger Account Guardian EA Initialized.");
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| HTTP POST Request Wrapper                                        |
//+------------------------------------------------------------------+
bool SendTelemetry(string payload) {
    char post[], result[];
    string headers = "Content-Type: application/json\r\n";
    StringToCharArray(payload, post, 0, WHOLE_ARRAY, CP_UTF8);
    // Remove the null terminator added by StringToCharArray
    ArrayResize(post, ArraySize(post) - 1);
    
    string result_headers;
    int res = WebRequest("POST", ApiUrl, headers, 1000, post, result, result_headers);
    
    if (res == -1) {
        Print("WebRequest failed. Error code: ", GetLastError());
        return false;
    } else if (res != 200) {
        Print("API returned HTTP ", res);
        return false;
    }
    
    Print("Telemetry dispatched successfully.");
    return true;
}

//+------------------------------------------------------------------+
//| Trade Transaction Hook                                           |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result) {
                        
    // We only care about dealt historical deals (fills)
    if (trans.type != TRADE_TRANSACTION_DEAL_ADD) return;

    if (HistoryDealSelect(trans.deal)) {
        long deal_entry = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
        long ticket = HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
        string symbol = HistoryDealGetString(trans.deal, DEAL_SYMBOL);
        double volume = HistoryDealGetDouble(trans.deal, DEAL_VOLUME);
        long type = HistoryDealGetInteger(trans.deal, DEAL_TYPE); // 0 = BUY, 1 = SELL
        string order_type = (type == 0) ? "BUY" : "SELL";
        
        long time_msc = HistoryDealGetInteger(trans.deal, DEAL_TIME_MSC);
        long account = AccountInfoInteger(ACCOUNT_LOGIN);
        double balance = AccountInfoDouble(ACCOUNT_BALANCE);
        double equity = AccountInfoDouble(ACCOUNT_EQUITY);
        
        string payload = "";

        // Entry Deal -> POSITION_OPENED
        if (deal_entry == DEAL_ENTRY_IN) {
            double price_open = HistoryDealGetDouble(trans.deal, DEAL_PRICE);
            
            // Retrieve SL/TP from the open position
            double sl = 0, tp = 0;
            if (PositionSelectByTicket(ticket)) {
                sl = PositionGetDouble(POSITION_SL);
                tp = PositionGetDouble(POSITION_TP);
            }
            
            payload = StringFormat(
                "{\"event_type\":\"POSITION_OPENED\",\"broker_time_msc\":%I64d,\"account_number\":%I64d,\"ticket\":%I64d,\"symbol\":\"%s\",\"order_type\":\"%s\",\"volume\":%f,\"price_open\":%f,\"price_sl\":%f,\"price_tp\":%f,\"balance\":%f,\"equity\":%f}",
                time_msc, account, ticket, symbol, order_type, volume, price_open, sl, tp, balance, equity
            );
        }
        // Exit Deal -> POSITION_CLOSED
        else if (deal_entry == DEAL_ENTRY_OUT) {
            double price_close = HistoryDealGetDouble(trans.deal, DEAL_PRICE);
            double realized_profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
            double commission = HistoryDealGetDouble(trans.deal, DEAL_COMMISSION);
            double swap = HistoryDealGetDouble(trans.deal, DEAL_SWAP);
            double net_profit = realized_profit + commission + swap;
            
            payload = StringFormat(
                "{\"event_type\":\"POSITION_CLOSED\",\"broker_time_msc\":%I64d,\"account_number\":%I64d,\"ticket\":%I64d,\"symbol\":\"%s\",\"price_close\":%f,\"realized_profit\":%f,\"commission\":%f,\"swap\":%f,\"net_profit\":%f,\"balance\":%f,\"equity\":%f}",
                time_msc, account, ticket, symbol, price_close, realized_profit, commission, swap, net_profit, balance, equity
            );
        }
        
        if (payload != "") {
            SendTelemetry(payload);
        }
    }
}
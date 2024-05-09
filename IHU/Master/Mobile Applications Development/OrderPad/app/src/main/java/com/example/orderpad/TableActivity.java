package com.example.orderpad;

import android.content.Intent;
import android.graphics.Color;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.Xml;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserFactory;

import java.io.StringReader;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TableActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_table); // Ensure this layout exists in your res/layout folder
        setupTableButtons();  // Setup buttons first
        fetchTableData();     // Fetch data when activity starts
    }
    private void setupTableButtons() {
        int[] buttonIds = new int[] {
                R.id.btnTable1, R.id.btnTable2, R.id.btnTable3,
                R.id.btnTable4, R.id.btnTable5, R.id.btnTable6,
                R.id.btnTable7, R.id.btnTable8, R.id.btnTable9
        };

        for (int id : buttonIds) {
            Button tableButton = findViewById(id);
            tableButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // Intent to launch OrderActivity with table ID
                    Intent intent = new Intent(TableActivity.this, OrderActivity.class);
                    String tableId = getResources().getResourceEntryName(v.getId()).replace("btnTable", "");
                    intent.putExtra("table_id", tableId);
                    startActivity(intent);
                }
            });
            tableButton.setOnLongClickListener(new View.OnLongClickListener() {
                @Override
                public boolean onLongClick(View v) {
                    // Intent to launch PaymentActivity with table ID
                    Intent intent = new Intent(TableActivity.this, PaymentActivity.class);
                    String tableId = getResources().getResourceEntryName(v.getId()).replace("btnTable", "");
                    intent.putExtra("table_id", tableId);
                    startActivity(intent);
                    return true;
                }
            });
        }
    }

    private void fetchTableData() {
        String personalToken = "2973";
        String url = "http://mad.mywork.gr/get_coffee_data.php?t=" + personalToken;
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler handler = new Handler(Looper.getMainLooper());

        executor.execute(() -> {
            WebRequest webRequest = new WebRequest(url);
            String result = webRequest.GetResponse();
            handler.post(() -> {
                if (result != null && !result.isEmpty()) {
                    parseXMLAndUpdateUI(result);
                } else {
                    Toast.makeText(TableActivity.this, "Failed to fetch data!", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }


    private void parseXMLAndUpdateUI(String xmlData) {
        try {
            XmlPullParser parser = Xml.newPullParser();
            parser.setInput(new StringReader(xmlData));
            int eventType = parser.getEventType();
            int buttonIndex = 1; // Start with btnTable1

            while (eventType != XmlPullParser.END_DOCUMENT) {
                if (eventType == XmlPullParser.START_TAG) {
                    String tagName = parser.getName();
                    if ("table".equals(tagName)) {
                        String id = null;
                        String status = null;

                        while (!(eventType == XmlPullParser.END_TAG && "table".equals(parser.getName()))) {
                            if (eventType == XmlPullParser.START_TAG) {
                                if ("id".equals(parser.getName())) {
                                    id = parser.nextText().trim();
                                } else if ("status".equals(parser.getName())) {
                                    status = parser.nextText().trim();
                                }
                            }
                            eventType = parser.next();
                        }

                        if (id != null && status != null) {
                            updateButton(buttonIndex, id, status);
                            buttonIndex++;
                        }
                    }
                }
                eventType = parser.next();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Error parsing XML", Toast.LENGTH_SHORT).show();
            Log.e("XML Parse Error", "Error parsing XML", e);
        }
    }

    private void updateButton(int index, String tableId, String status) {
        int buttonId = getResources().getIdentifier("btnTable" + index, "id", getPackageName());
        Button button = findViewById(buttonId);
        if (button != null) {
            button.setText("Table " + tableId);
            button.setBackgroundColor("0".equals(status) ? Color.GREEN : Color.RED);
            setButtonListeners(button, tableId);
        }
    }

    private void setButtonListeners(Button button, String tableId) {
        button.setOnClickListener(v -> {
            Intent intent = new Intent(TableActivity.this, OrderActivity.class);
            intent.putExtra("table_id", tableId);
            startActivity(intent);
        });
        button.setOnLongClickListener(v -> {
            Intent intent = new Intent(TableActivity.this, PaymentActivity.class);
            intent.putExtra("table_id", tableId);
            startActivity(intent);
            return true;
        });
    }





}

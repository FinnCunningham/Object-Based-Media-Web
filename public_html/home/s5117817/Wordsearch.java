// 
// Decompiled by Procyon v0.5.36
// 

package wordsearch;

import java.io.Writer;
import java.io.PrintWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.Reader;
import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;

public class Wordsearch
{
    public static void main(final String[] args) {
        final char[][] g1 = new char[20][20]; //gridlist
        final String[] g2 = new String[20]; //words
        final ArrayList<String> u1 = new ArrayList<String>();
        final ArrayList<Boolean> z1 = new ArrayList<Boolean>();
        final ArrayList<Integer> r1 = new ArrayList<Integer>();
        final ArrayList<String> s1 = new ArrayList<String>();
        final ArrayList<Boolean> z2 = new ArrayList<Boolean>();
        final ArrayList<Boolean> z3 = new ArrayList<Boolean>();
        final ArrayList<Boolean> z4 = new ArrayList<Boolean>();
        final int K1 = 1;
        final int K2 = 2;
        final int K3 = 3;
        final int K4 = 0;
        int g3 = 0; //grid size?????
        try {
            final FileReader reader = new FileReader("grid.txt");
            final BufferedReader gridFile = new BufferedReader(reader);
            int n2 = 0;
            boolean e1 = false;
            String t6 = gridFile.readLine();
            g3 = t6.length();
            if (g3 <= 4 || g3 >= 22) {
                System.out.println("Grid size out of range");
                e1 = true;
            }
            else {
                g2[0] = t6;
                n2 = 1;
                for (int i = 0; !e1 && i < t6.length(); ++i) {
                    if (!Character.isUpperCase(t6.charAt(i))) {
                        e1 = true;
                        System.out.println("Non-uppercase character in grid");
                    }
                }
            }
            while (!e1 && (t6 = gridFile.readLine()) != null) {
                if (t6.length() != g3) {
                    System.out.println("Grid not square");
                    e1 = true;
                }
                else {
                    g2[n2] = t6;
                    ++n2;
                    for (int i = 0; !e1 && i < t6.length(); ++i) {
                        if (!Character.isUpperCase(t6.charAt(i))) {
                            e1 = true;
                            System.out.println("Non-uppercase character in grid");
                        }
                    }
                }
            }
            if (!e1 && n2 < g3) {
                System.out.println("Grid not square");
                System.out.println("Gold star!");
                e1 = true;
            }
            else if (!e1) {
                for (int i = 0; i < g3; ++i) {
                    for (int j = 0; j < g3; ++j) {
                        g1[i][j] = g2[i].charAt(j);
                    }
                }
            }
            reader.close();
        }
        catch (FileNotFoundException e2) {
            System.out.println("Cannot open flie");
            System.exit(1);
        }
        catch (IOException e3) {
            System.out.println("Cannot open file");
            System.exit(1);
        }
        try {
            final FileReader reader = new FileReader("words.txt");
            final BufferedReader wordsFile = new BufferedReader(reader);
            boolean w1 = false;
            String t6;
            while ((t6 = wordsFile.readLine()) != null) {
                String temp = "";
                for (int i = 0; i < t6.length(); ++i) {
                    if (Character.isLetter(t6.charAt(i))) {
                        final String temp2 = t6.substring(i, i + 1);
                        temp += temp2.toUpperCase();
                    }
                }
                if (temp.length() > 0) {
                    int p6 = u1.size();
                    for (int j = 0; j < u1.size(); ++j) {
                        if (temp.compareTo((String)u1.get(j)) < 0) {
                            p6 = j;
                        }
                    }
                    u1.add(p6, temp);
                    z2.add(p6, false);
                    z3.add(p6, false);
                    z4.add(p6, false);
                    if (u1.get(p6).length() < 3) {
                        z1.add(p6, true);
                        r1.add(p6, 1);
                    }
                    else {
                        z1.add(p6, false);
                        r1.add(p6, 0);
                        w1 = true;
                    }
                    s1.add(p6, "");
                }
            }
            reader.close();
            if (!w1) {
                System.out.println("No valid words in words.txt");
                System.exit(1);
            }
            else {
                final int n3 = u1.size();
                for (int i = 0; i < n3 - 1; ++i) {
                    if (!z1.get(i)) {
                        final String thisWord = new String(u1.get(i));
                        for (int k = i + 1; k < n3 - 1; ++k) {
                            if (!z1.get(k)) {
                                final String thatWord = new String(u1.get(k));
                                if (thisWord.equals(thatWord)) {
                                    z1.set(k, true);
                                    r1.set(k, 2);
                                }
                            }
                        }
                    }
                }
                for (int i = 0; i < n3; ++i) {
                    if (!z1.get(i)) {
                        final String t7 = new String(u1.get(i));
                        final int l3 = t7.length();
                        final char[] thing = new char[l3];
                        for (int m = 0; m < l3; ++m) {
                            thing[m] = t7.charAt(m);
                        }
                        boolean whatever = true;
                        for (int j2 = 0; j2 < l3 && whatever; ++j2) {
                            if (thing[j2] != thing[l3 - j2 - 1]) {
                                whatever = false;
                            }
                        }
                        z2.set(i, whatever);
                    }
                    final String t7 = new String(u1.get(i));
                    final int t8 = t7.length();
                    for (int j3 = 0; j3 < n3; ++j3) {
                        if (i != j3 && !z1.get(j3)) {
                            final String x0 = new String(u1.get(j3));
                            final int q8 = x0.length();
                            if (q8 > t8) {
                                for (int k2 = 0; k2 <= q8 - t8; ++k2) {
                                    if (t7.charAt(0) == x0.charAt(k2) && t7.equals(x0.substring(k2, k2 + t8))) {
                                        z1.set(i, true);
                                        r1.set(i, 3);
                                        s1.set(i, x0);
                                    }
                                }
                            }
                        }
                    }
                    String b6 = "";
                    for (int m = t8 - 1; m >= 0; --m) {
                        b6 += t7.substring(m, m + 1);
                    }
                    for (int m = i + 1; m < n3; ++m) {
                        if (!z1.get(m)) {
                            final String x2 = new String(u1.get(m));
                            if (b6.equals(x2)) {
                                z3.set(i, true);
                                z3.set(m, true);
                            }
                        }
                    }
                }
            }
        }
        catch (FileNotFoundException e2) {
            System.out.println("Cannot open file");
            System.exit(1);
        }
        catch (IOException e3) {
            System.out.println("Cannot open file");
            System.exit(1);
        }
        try {
            final FileWriter writer = new FileWriter("results.txt");
            final PrintWriter resultsFile = new PrintWriter(writer);
            for (int i2 = 0; i2 < u1.size(); ++i2) {
                resultsFile.print(u1.get(i2) + " ");
                if (z1.get(i2)) {
                    resultsFile.print("- removed from list - ");
                    final String[] s2 = { "less than 3 letters", "duplicate", "subset of " };
                    resultsFile.print(s2[r1.get(i2) - 1]);
                    if (r1.get(i2) == 3) {
                        resultsFile.print(s1.get(i2));
                    }
                }
                else {
                    if (z2.get(i2)) {
                        resultsFile.print("- is pralinedome - ");
                    }
                    else if (z3.get(i2)) {
                        resultsFile.print("- is reversal - ");
                    }
                    final String s3 = new String(u1.get(i2));
                    final int v7 = s3.length();
                    final char[] v8 = new char[v7];
                    for (int j = 0; j < v7; ++j) {
                        v8[j] = s3.charAt(j);
                    }
                    for (int r2 = 0; r2 < g3; ++r2) {
                        for (int s4 = 0; s4 < g3; ++s4) {
                            if (v8[0] == g1[r2][s4]) {
                                final int r3 = r2 + 1;
                                final int s5 = s4 + 1;
                                int t9;
                                for (t9 = 0, t9 = 1; t9 < v7 && s4 + t9 < g3 && !z4.get(i2) && v8[t9] == g1[r2][s4 + t9]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3 + 1);
                                    resultsFile.print(" column " + s5 + " horizontal forward");
                                    z4.set(i2, true);
                                }
                                for (t9 = 0, t9 = 1; t9 < v7 && s4 - t9 >= 0 && v8[t9] == g1[r2][s4 - t9]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3);
                                    resultsFile.print(" column " + s5 + " horizontal backward");
                                    z4.set(i2, true);
                                }
                                for (t9 = 0, t9 = 1; t9 < v7 && r2 - t9 >= 0 && v8[t9] == g1[r2 - t9][s4]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3);
                                    resultsFile.print(" column " + s5 + " vertical up");
                                    z4.set(i2, true);
                                }
                                for (t9 = 0, t9 = 1; t9 < v7 && r2 + t9 < g3 && v8[t9] == g1[r2 + t9][s4]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3);
                                    resultsFile.print(" colum " + s5 + " vertical down");
                                    z4.set(i2, true);
                                }
                                for (t9 = 0, t9 = 1; t9 < v7 && r2 - t9 > 0 && s4 + t9 < g3 && v8[t9] == g1[r2 - t9][s4 + t9]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3);
                                    resultsFile.print(" column " + s5 + " diagonal down");
                                    z4.set(i2, true);
                                }
                                for (t9 = 0, t9 = 1; t9 < v7 && r2 + t9 < g3 && s4 + t9 < g3 && v8[t9] == g1[r2 + t9][s4 + t9]; ++t9) {}
                                if (t9 == v7) {
                                    if (z4.get(i2)) {
                                        resultsFile.println();
                                        resultsFile.print("and ");
                                    }
                                    resultsFile.print("starts at row " + r3);
                                    resultsFile.print(" column " + s5 + " diagonal down");
                                    z4.set(i2, true);
                                }
                            }
                        }
                    }
                    if (!z4.get(i2)) {
                        resultsFile.print("- not found");
                    }
                }
                resultsFile.println();
            }
            resultsFile.close();
        }
        catch (FileNotFoundException e2) {
            System.out.println("Cannot open results.txt");
        }
        catch (IOException e3) {
            System.out.println("Cannot write to results.txt");
        }
    }
}
